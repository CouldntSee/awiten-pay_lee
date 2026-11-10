// ============================================================================
// AWITEN-Pay (AWITEN.ai) — 13-Hour Corridor Simulator & Backend Telemetry Sync
// ============================================================================

let autoSimInterval = null;

const TRUCK_PRESETS = {
    bgt402: {
        label: "BGT-402 · Mang Ramon (8t Cabbage)",
        defaultHour: 4.5,
        baseTemp: 17.5,
        peakTemp: 36.6,
        baseRH: 86,
        minRH: 46,
        decayMultiplier: 1.0
    },
    bgt118: {
        label: "BGT-118 · Co-op #2 (6.5t Wombok)",
        defaultHour: 3.0,
        baseTemp: 16.8,
        peakTemp: 25.4,
        baseRH: 88,
        minRH: 68,
        decayMultiplier: 0.35
    },
    nvt309: {
        label: "NVT-309 · Bambang Hauler (9t Carrots)",
        defaultHour: 2.5,
        baseTemp: 18.0,
        peakTemp: 27.5,
        baseRH: 84,
        minRH: 64,
        decayMultiplier: 0.45
    }
};

function getCorridorLocationName(hour) {
    const h = parseFloat(hour);
    if (h <= 0.5) return "BAPTC La Trinidad Loading Dock (Cool 17.5°C)";
    if (h <= 2.5) return "Buguias Mountain Dead Zone (Offline Flash Buffering)";
    if (h <= 4.0) return "TPLEX Sison Lowland Entry (x402 Oracle Queried · 1.00 XLM)";
    if (h <= 5.5) return "Tarlac / Bulacan Junction (40m Before Grade Crash [DIVERT])";
    if (h <= 7.5) return "Pulilan Bulacan Dehydrator Exit Window";
    if (h <= 10.5) return "NLEX Bocaue Overnight Traffic Gridlock";
    return "Balintawak Manila Gate (2 Tons Rotted, 6 Tons Slashed)";
}

function updateSimulation(hourValue) {
    const h = parseFloat(hourValue);
    const presetKey = (window.currentSimState && window.currentSimState.preset) || "bgt402";
    const preset = TRUCK_PRESETS[presetKey] || TRUCK_PRESETS.bgt402;

    const hourTextEl = document.getElementById("hourText");
    if (hourTextEl) {
        hourTextEl.innerText = h.toFixed(1) + " / 13h";
    }

    const locEl = document.getElementById("corridorLocationLabel");
    if (locEl) {
        locEl.innerText = getCorridorLocationName(h);
    }

    const sliderEl = document.getElementById("routeSlider");
    if (sliderEl && parseFloat(sliderEl.value) !== h) {
        sliderEl.value = h;
    }

    let tempC, rhPercent, freshness;

    if (presetKey === "bgt402" && Math.abs(h - 4.5) < 0.05) {
        tempC = 34.2;
        rhPercent = 54;
        freshness = 62.4;
    } else {
        const progress = Math.min(1, Math.max(0, h / 13));
        const thermalRamp = Math.pow(progress, 0.68);
        tempC = preset.baseTemp + (preset.peakTemp - preset.baseTemp) * thermalRamp;
        rhPercent = preset.baseRH - (preset.baseRH - preset.minRH) * thermalRamp;
        freshness = Math.max(18.0, 96.0 - h * 7.45 * preset.decayMultiplier);
    }

    const stopHours = [0, 1, 2, 3, 4, 4.5, 6, 7, 8.5, 10, 11.5, 13];
    const freshnessCurve = stopHours.map((stopH) => {
        if (presetKey === "bgt402" && stopH === 4.5 && Math.abs(h - 4.5) < 0.2) {
            return 62.4;
        }
        const delta = Math.max(0, h - 4.5) * 0.6 * preset.decayMultiplier;
        const val = 96.0 - stopH * 5.65 * preset.decayMultiplier - delta;
        return parseFloat(Math.max(15, val).toFixed(1));
    });

    const tempCurve = stopHours.map((stopH) => {
        const p = Math.pow(stopH / 13, 0.68);
        const t = preset.baseTemp + (preset.peakTemp - preset.baseTemp) * p;
        return parseFloat(t.toFixed(1));
    });

    if (typeof updateChartData === "function") {
        updateChartData(freshnessCurve, tempCurve);
    }

    if (typeof runAIAnalysis === "function") {
        runAIAnalysis(freshness, h, tempC, rhPercent);
    }

    if (typeof syncDriverAppViewForHour === "function") {
        syncDriverAppViewForHour(h);
    }

    // Zero-Click Autonomous Agent triggers
    if (window.autonomousAgentMode !== false) {
        // Reset triggers when scrubbing backwards to safe/good hours
        if (h < 3.0) {
            window.hasTriggeredOracleHour3 = false;
            window.hasLoggedOracleGateWarning = false;
        }
        if (
            h < 4.5 ||
            (window.currentSimState &&
                window.currentSimState.decisionCode === "HOLD_PRIMARY_ROUTE")
        ) {
            window.hasTriggeredDiversionHour45 = false;
        }

        // Hour 3.0 x402 Oracle Query with strict wallet gate
        if (h >= 3.0 && !window.hasTriggeredOracleHour3) {
            if (!window.connectedVeloWalletAddress) {
                if (!window.hasLoggedOracleGateWarning) {
                    window.hasLoggedOracleGateWarning = true;
                    if (typeof appendTerminalLogUI === "function") {
                        appendTerminalLogUI(
                            "ORACLE GATE",
                            "1.00 XLM query held: Connect Velo Wallet to authorize autonomous payment."
                        );
                    }
                }
            } else {
                window.hasTriggeredOracleHour3 = true;
                if (typeof executeAutonomousOracleQueryUI === "function") {
                    executeAutonomousOracleQueryUI();
                }
            }
        }

        // Hour 4.5 Autonomous Diversion Flow (only when biophysical decision requires diversion)
        if (h >= 4.5 && !window.hasTriggeredDiversionHour45) {
            if (
                window.currentSimState &&
                window.currentSimState.decisionCode === "EXECUTE_AUTONOMOUS_DIVERSION"
            ) {
                if (window.connectedVeloWalletAddress) {
                    window.hasTriggeredDiversionHour45 = true;
                    if (typeof triggerAutonomousDiversionFlow === "function") {
                        triggerAutonomousDiversionFlow(
                            "Bulacan Food Dehydrator (Contracted Floor)",
                            32.0,
                            { zeroClick: true }
                        );
                    }
                }
            }
        }
    }

    // Asynchronously notify the backend DecisionEngine if Express server is active
    fetch("/api/agent/evaluate-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            presetId: presetKey,
            hour: h,
            tempC: parseFloat(tempC.toFixed(1)),
            rhPercent: Math.round(rhPercent),
            freshness: parseFloat(freshness.toFixed(1))
        })
    }).catch(() => {});
}

function switchTruckPreset(presetKey) {
    window.hasTriggeredOracleHour3 = false;
    window.hasTriggeredDiversionHour45 = false;
    window.hasLoggedOracleGateWarning = false;

    const preset = TRUCK_PRESETS[presetKey] || TRUCK_PRESETS.bgt402;
    if (window.currentSimState) {
        window.currentSimState.preset = presetKey;
    }

    const bannerLabel = document.getElementById("activeTruckBannerLabel");
    if (bannerLabel) {
        bannerLabel.innerText = preset.label;
    }

    updateSimulation(preset.defaultHour);

    if (typeof showNotification === "function") {
        showNotification("Viewing " + preset.label);
    }
}

function toggleAutoSimulation() {
    const playBtn = document.getElementById("simPlayBtn");
    const sliderEl = document.getElementById("routeSlider");

    if (autoSimInterval) {
        clearInterval(autoSimInterval);
        autoSimInterval = null;
        if (playBtn) {
            playBtn.innerText = "Play Route";
        }
        return;
    }

    if (playBtn) {
        playBtn.innerText = "Pause Route";
    }

    let currentHour = sliderEl ? parseFloat(sliderEl.value) : 0;
    if (currentHour >= 12.5) currentHour = 0;

    autoSimInterval = setInterval(() => {
        currentHour += 0.5;
        if (currentHour > 13.0) {
            clearInterval(autoSimInterval);
            autoSimInterval = null;
            if (playBtn) {
                playBtn.innerText = "Play Route";
            }
            return;
        }
        updateSimulation(currentHour);
    }, 900);
}

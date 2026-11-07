// ============================================================================
// AWITEN-Pay (AWITEN.ai) — 3-Layer AI Telemetry & Autonomous Decision Engine UI
// ============================================================================

window.currentSimState = {
    preset: "bgt402",
    hour: 4.5,
    temp: 34.2,
    rh: 54,
    vpd: 2.48,
    respRate: 174,
    freshness: 62.4,
    rul: 2.8,
    grade: "Grade 3",
    action: "1-Tap Divert Now",
    decisionCode: "EXECUTE_AUTONOMOUS_DIVERSION",
    recommendedBuyer: "Bulacan Food Dehydrator",
    recommendedPrice: 32.0,
    tonnageKg: 8000
};

function calculateVPD(tempC, rhPercent) {
    const es = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    const vpd = es * (1 - rhPercent / 100);
    return Math.max(0.15, parseFloat(vpd.toFixed(2)));
}

function calculateRespirationRate(tempC) {
    const baseRateAt10C = 28.0;
    const q10 = 2.15;
    return Math.round(baseRateAt10C * Math.pow(q10, (tempC - 10) / 10));
}

function runAIAnalysis(freshnessScore, hour, tempC, rhPercent) {
    const fScore = parseFloat(freshnessScore);
    const h = parseFloat(hour ?? window.currentSimState.hour ?? 4.5);
    const temp = parseFloat(tempC ?? window.currentSimState.temp ?? 34.2);
    const rh = parseFloat(rhPercent ?? window.currentSimState.rh ?? 54);

    const vpd = calculateVPD(temp, rh);
    const respRate = calculateRespirationRate(temp);

    let rulHours = 0;
    if (fScore > 50) {
        const decayVelocity = Math.max(2.2, (temp - 15) * 0.42);
        rulHours = Math.max(0.3, (fScore - 50) / decayVelocity);
    }

    const etaManila = Math.max(0, 13.0 - h);

    let grade = "";
    let gradePillClass = "pill pill-green";
    let gradeSub = "";
    let action = "";
    let decisionCode = "HOLD_PRIMARY_ROUTE";
    let buyerSub = "";
    let statusColor = "#15803d";
    let nsgaStatus = "";
    let evDeltaText = "";
    let bannerDesc = "";

    const highestBrokerBid = window.currentBrokerBid || 33.5;

    if (fScore >= 85 && h < 3.0) {
        grade = "Grade 1";
        gradePillClass = "pill pill-green";
        gradeSub = "Wholesale Retail Grade";
        action = "Continue to Manila";
        decisionCode = "HOLD_PRIMARY_ROUTE";
        buyerSub = "Balintawak Target: ₱45/kg";
        statusColor = "#15803d";
        nsgaStatus = "Safe Transit · Firewall On";
        evDeltaText = "₱360,000";
        bannerDesc =
            "Cargo is healthy (<strong>" +
            fScore.toFixed(1) +
            "% Freshness</strong>). Stay on primary route to Balintawak Wholesale Market. Noir Farmer Firewall keeps shipment shielded.";
    } else if (fScore >= 70 && h < 4.5) {
        grade = "Grade 2";
        gradePillClass = "pill pill-green";
        gradeSub = "Minor Outer Wilt";
        action = "Query x402 Oracle (1 XLM)";
        decisionCode = "QUERY_X402_ORACLE";
        buyerSub = "Urdaneta / Tarlac Standby";
        statusColor = "#0b6e3b";
        nsgaStatus = "x402 Oracle Queried (1.00 XLM)";
        evDeltaText = "+₱64,000 Protected";
        bannerDesc =
            "Canopy warming detected (<strong>" +
            fScore.toFixed(1) +
            "% Freshness</strong>). Autonomous agent paid <strong>1.00 XLM</strong> via Noir to query live NLEX traffic &amp; Bulacan dock capacity.";
    } else if (fScore >= 50) {
        grade = "Grade 3";
        gradePillClass = "pill pill-amber";
        gradeSub = "Processing Tier";
        action = "1-Tap Divert Now";
        decisionCode = "EXECUTE_AUTONOMOUS_DIVERSION";
        buyerSub = "Bulacan Floor: ₱32/kg (25.60 XLM)";
        statusColor = "#d97706";
        nsgaStatus = "Divert Window Open [ACTION]";
        evDeltaText = "+₱117,980";
        bannerDesc =
            "Divert Truck BGT-402 40 mins early to <strong>Bulacan Dehydrator (@ ₱32/kg · 25.60 XLM)</strong> or accept broker bid (<strong>₱" +
            highestBrokerBid.toFixed(2) +
            "/kg</strong>) to lock in <strong>₱237,980 net (23.80 XLM)</strong> and save <strong>+₱117,980</strong>.";
    } else {
        grade = "Grade 4";
        gradePillClass = "pill pill-red";
        gradeSub = "Severe Spoilage Risk";
        action = "Emergency Salvage";
        decisionCode = "EXECUTE_AUTONOMOUS_DIVERSION";
        buyerSub = "Feed Mill Floor: ₱12/kg (9.60 XLM)";
        statusColor = "#dc2626";
        nsgaStatus = "Wholesale Grade Lost";
        evDeltaText = "+₱85,180 Salvaged";
        bannerDesc =
            "Cargo dropped below Grade 3 (<strong>" +
            fScore.toFixed(1) +
            "%</strong>). Reroute immediately to <strong>Central Luzon Feed Mill (@ ₱12/kg)</strong> to avoid landfill loss.";
    }

    // Root-cause breakdown percentages
    const rawThermal = Math.max(18, (temp - 15) * 2.8 + h * 1.6);
    const rawMoisture = Math.max(10, vpd * 11.5);
    const rawVibration = Math.max(8, 12 + Math.sin(h) * 4);
    const rawLatent = Math.max(6, 14 - h * 0.5);
    const totalRaw = rawThermal + rawMoisture + rawVibration + rawLatent;

    const pThermal = Math.round((rawThermal / totalRaw) * 100);
    const pMoisture = Math.round((rawMoisture / totalRaw) * 100);
    const pVibration = Math.round((rawVibration / totalRaw) * 100);
    const pLatent = Math.max(4, 100 - (pThermal + pMoisture + pVibration));

    window.currentSimState = {
        ...window.currentSimState,
        hour: h,
        temp: temp,
        rh: rh,
        vpd: vpd,
        respRate: respRate,
        freshness: fScore,
        rul: rulHours,
        grade: grade,
        action: action,
        decisionCode: decisionCode
    };

    const setElText = (id, text, color) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = text;
            if (color) el.style.color = color;
        }
    };

    setElText("freshnessScore", fScore.toFixed(1) + "%", statusColor);
    setElText("tempValue", temp.toFixed(1) + "°C", temp >= 31 ? "#dc2626" : temp >= 25 ? "#d97706" : "#15803d");
    setElText("rhValue", "RH: " + Math.round(rh) + "%");
    setElText("vpdValue", vpd.toFixed(2) + " kPa");
    setElText("respValue", "Heat: " + respRate + " mW/kg");
    setElText("rulValue", rulHours.toFixed(1) + " hrs", statusColor);
    setElText("gradeSubtext", gradeSub);
    setElText("aiAction", action, statusColor);
    setElText("aiBuyerSub", buyerSub);
    setElText("nsgaStatusText", nsgaStatus, statusColor);
    setElText("liveEvDelta", evDeltaText, "#15803d");
    setElText("brokerFeedFScore", fScore.toFixed(1) + "%", statusColor);

    // Sync Centerpiece 3-Column Decision Engine Matrix (Col 1 Biophysical Trigger)
    setElText("matrixRul", rulHours.toFixed(1) + "h", rulHours < etaManila ? "#dc2626" : "#15803d");
    setElText("matrixEta", etaManila.toFixed(1) + "h", rulHours < etaManila ? "#dc2626" : "#475569");
    setElText("matrixTemp", temp.toFixed(1) + "°C", temp >= 31 ? "#dc2626" : temp >= 25 ? "#d97706" : "#15803d");
    setElText("matrixRh", Math.round(rh) + "% RH", rh <= 60 ? "#d97706" : "#15803d");
    setElText("matrixResp", respRate + " mW/kg", respRate >= 120 ? "#dc2626" : "#15803d");
    setElText("matrixVpd", vpd.toFixed(2) + " kPa", vpd >= 1.8 ? "#d97706" : "#15803d");

    const triggerBadgeEl = document.getElementById("matrixTriggerBadge");
    if (triggerBadgeEl) {
        if (decisionCode === "HOLD_PRIMARY_ROUTE") {
            triggerBadgeEl.className = "pill pill-green";
            triggerBadgeEl.innerHTML = '<span class="status-dot status-dot-green"></span> SAFE TRANSIT';
        } else if (decisionCode === "QUERY_X402_ORACLE") {
            triggerBadgeEl.className = "pill pill-blue";
            triggerBadgeEl.innerHTML = '<span class="status-dot status-dot-blue"></span> X402 ORACLE ACTIVE';
        } else {
            triggerBadgeEl.className = "pill pill-amber";
            triggerBadgeEl.innerHTML = '<span class="status-dot status-dot-amber"></span> DIVERT REQUIRED';
        }
    }

    const triggerDescEl = document.getElementById("matrixTriggerDesc");
    if (triggerDescEl) {
        if (rulHours < etaManila) {
            const gap = Math.max(0.1, etaManila - rulHours).toFixed(1);
            triggerDescEl.innerText = `RUL (${rulHours.toFixed(1)}h) < ETA (${etaManila.toFixed(1)}h) · Spoils ${gap}h before Balintawak`;
            triggerDescEl.style.color = "#991b1b";
        } else {
            triggerDescEl.innerText = `RUL (${rulHours.toFixed(1)}h) >= ETA (${etaManila.toFixed(1)}h) · Safe margin to Manila`;
            triggerDescEl.style.color = "#065f46";
        }
    }

    // Sync Tab 1 Decision Engine summary cards
    setElText("engineDecisionBadge", decisionCode);
    setElText(
        "engineLayer1Summary",
        `VPD ${vpd.toFixed(2)} kPa · ${respRate} mW/kg · RUL ${rulHours.toFixed(1)}h`
    );
    setElText(
        "engineRationaleText",
        `Hour ${h.toFixed(1)}h: RUL (${rulHours.toFixed(1)}h) vs ETA_Manila (${etaManila.toFixed(1)}h) at ${temp.toFixed(1)}°C (${respRate} mW/kg) -> ${decisionCode}`
    );

    // Sync Portal #3 Driver Mobile App temperature & route banner
    setElText(
        "driverPhoneTempBadge",
        `${temp.toFixed(1)}°C · RH ${Math.round(rh)}%`
    );

    const gradeEl = document.getElementById("aiGrade");
    if (gradeEl) {
        gradeEl.innerText = grade;
        gradeEl.className = gradePillClass;
    }

    const bannerEl = document.getElementById("rerouteBannerDesc");
    if (bannerEl) bannerEl.innerHTML = bannerDesc;

    const updateShapBar = (valId, barId, pct) => {
        const vEl = document.getElementById(valId);
        const bEl = document.getElementById(barId);
        if (vEl) vEl.innerText = pct + "%";
        if (bEl) bEl.style.width = pct + "%";
    };

    updateShapBar("shapThermalVal", "shapThermalBar", pThermal);
    updateShapBar("shapMoistureVal", "shapMoistureBar", pMoisture);
    updateShapBar("shapVibrationVal", "shapVibrationBar", pVibration);
    updateShapBar("shapLatentVal", "shapLatentBar", pLatent);
}

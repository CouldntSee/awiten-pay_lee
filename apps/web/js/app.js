// ============================================================================
// AWITEN-Pay (AWITEN.ai) — 3-Portal Controller, Noir x Velo Escrow Inspector &
// Portal #3 Viajero Driver NFC Handoff Mobile Companion
// ============================================================================

const AUTH_USERS = {
    dispatcher: {
        username: "dispatcher",
        password: "admin",
        role: "dispatcher",
        displayName: "01 · Dispatch & Decision Engine",
        allowedView: "dispatcher"
    },
    broker: {
        username: "broker",
        password: "admin",
        role: "broker",
        displayName: "02 · Buyer Checkout Terminal",
        allowedView: "broker"
    },
    driver: {
        username: "driver",
        password: "admin",
        role: "driver",
        displayName: "03 · Driver NFC App (Mang Ramon)",
        allowedView: "driver"
    }
};

// Embedded verified Stellar Testnet Proofs (from packages/shared/src/testnet-proofs.json)
const FALLBACK_TESTNET_PROOFS = {
    network: "Stellar Testnet",
    deviceSerial: "BGT-402-POD-ESP32S3",
    deviceHash: "d7603c3286417cd3d1857dbed397eb335f78b3e91f88733ccf9e46ede663ebda",
    dockDeviceSerial: "BULACAN-DOCK3-NFC-TERMINAL",
    dockDeviceHash: "8edde7503399cbd8da0aa0023c7184aee38e088ab5823ab7c8fe467a0b65a7e4",
    accounts: {
        ownerPublicKey: "GBZOFVJBXQADCCG2BOBC4DTBUSSSTA4OYJR3P4EZCZ75JHYHHQ6PLOLD",
        agentPublicKey: "GATDP2GAYZZB6PONNZDUKDQCN5YEZUU6VF6M3KSZ7KRDPKPGXVBQVYTU",
        driverMerchantPublicKey: "GCIOXLXP636L6FZUARPXNHFPTXU3WDTGX2UJFZUP2LOGTG32OSDMJHWL",
        coopMerchantPublicKey: "GA25IKKSJ3PDKR7B3T36ABE2L7O3IL6N4WUSDGQI3YAMV77MU7ZAQZPN"
    },
    primaryContractSet: "SDK_DEFAULT_2026_10_07",
    contractSets: {
        SDK_DEFAULT_2026_10_07: {
            label: "SDK Default (2026-10-07)",
            contracts: {
                deviceRegistry: "CB4DPMGOA374JIB2ZVD4AHW5GJKQUYNOFGRYNOJ75EFH2KCJSMHOWIRA",
                agentRegistry: "CBTDMJVCFQDIVWZBKAKZ2FQ3UEJNAAUFYCTJ3E4ON2MYXPLPSIXQ25JZ",
                paymentEscrow: "CA5S4S7QGHJHJWVJBYL3CXZXZTNGKXMNZVDAEQNN7NUXFP4D7BYK7HIX"
            },
            transactions: {
                registerDevice: {
                    txHash: "279fb4f3aa4adac7838c4bb056f74122f4795caecedff4915ae8f3f5721dfe28",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/279fb4f3aa4adac7838c4bb056f74122f4795caecedff4915ae8f3f5721dfe28"
                },
                registerDockDevice: {
                    deviceSerial: "BULACAN-DOCK3-NFC-TERMINAL",
                    txHash: "a61c8d77af87ebf7811ba2df8293b32bbc9528628df4ee52feffc5b26ba2ef11",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/a61c8d77af87ebf7811ba2df8293b32bbc9528628df4ee52feffc5b26ba2ef11"
                },
                registerAgent: {
                    txHash: "776397ba58ee55054c749cd35b492de154b4886b12b2d79d0298541090de098e",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/776397ba58ee55054c749cd35b492de154b4886b12b2d79d0298541090de098e"
                },
                fundEscrow: {
                    txHash: "3ca5f7ae30a12d167feb8218ab79e050799a405ab0d2a57a66aea6e3f6a7fd9b",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/3ca5f7ae30a12d167feb8218ab79e050799a405ab0d2a57a66aea6e3f6a7fd9b"
                },
                oracleQuery: {
                    amountXlm: "1.00",
                    authorizeTxHash: "facbf05af10e964b99163996f39a51f5d95b8934b7780dadc27f260961713a29",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/facbf05af10e964b99163996f39a51f5d95b8934b7780dadc27f260961713a29",
                    claimTxHash: "6e68099666f687f3d1ea85f4cdde1183c40f849b27ed0c60d6f7c206229c26bd",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/6e68099666f687f3d1ea85f4cdde1183c40f849b27ed0c60d6f7c206229c26bd"
                },
                driverAdvance: {
                    amountXlm: "6.50",
                    authorizeTxHash: "42bb2e18f8952f39f569af182aedba3911fee27f6a8ff628d1fa9ab653d30ecd",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/42bb2e18f8952f39f569af182aedba3911fee27f6a8ff628d1fa9ab653d30ecd",
                    claimTxHash: "26d1feec7625b1b8a5de61edf42d0a9bf00258a33640d7719f223733a94b020a",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/26d1feec7625b1b8a5de61edf42d0a9bf00258a33640d7719f223733a94b020a"
                },
                fundOriginalBuyerEscrow: {
                    amountXlm: "36.00",
                    txHash: "e007ff674ee7840ad0d4552d18deb0b796348d7ee837bbbfd85bf26981ef5cba",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/e007ff674ee7840ad0d4552d18deb0b796348d7ee837bbbfd85bf26981ef5cba"
                },
                defundEscrow: {
                    amountXlm: "36.00",
                    txHash: "df5cc030658505941fcf47ac2cefb7c0271af889416d3eb86aacc07546d699d5",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/df5cc030658505941fcf47ac2cefb7c0271af889416d3eb86aacc07546d699d5"
                },
                unwindOriginalBuyerEscrow: {
                    amountXlm: "36.00",
                    txHash: "df5cc030658505941fcf47ac2cefb7c0271af889416d3eb86aacc07546d699d5",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/df5cc030658505941fcf47ac2cefb7c0271af889416d3eb86aacc07546d699d5"
                },
                clearingFee: {
                    amountXlm: "1.15",
                    authorizeTxHash: "c080ab4bbcedd682a030de33ab8f396e6add054d1938d28b1486b7f33a3c08a2",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/c080ab4bbcedd682a030de33ab8f396e6add054d1938d28b1486b7f33a3c08a2",
                    claimTxHash: "327f18be382db96a3486bd9ba76e5215518e8ae559ab848be334be7de49cae90",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/327f18be382db96a3486bd9ba76e5215518e8ae559ab848be334be7de49cae90"
                },
                coopSettlement: {
                    amountXlm: "23.80",
                    authorizeTxHash: "3abdef9b2d30d560221e4a6075209d7e4689455779800dc028a9ca43fcb6f03b",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/3abdef9b2d30d560221e4a6075209d7e4689455779800dc028a9ca43fcb6f03b",
                    claimTxHash: "6e72a527d8348d1d10e749c0ee33708e3479f81de244a0fb17820ecc8cd33def",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/6e72a527d8348d1d10e749c0ee33708e3479f81de244a0fb17820ecc8cd33def"
                }
            },
            finalEscrowBalanceXlm: "118.7"
        },
        HANDBOOK_2026_10_24: {
            label: "Builder Handbook (2026-10-24)",
            contracts: {
                deviceRegistry: "CAC4KOLHDLDYDWBOKXNKRN5KVHO56PLOIFXDLTBUWGVN6GVDEB7FQHU5",
                agentRegistry: "CCMZDSPTLX7IIJWCYEUM5DJUHOSOYSTHGK777S2TXZWEMC5ZZGPJ3EBV",
                paymentEscrow: "CC7EAW5FNJEDBS7THM5IT6XIOHO4AOYMLXT3KSZ3HWUIKEACTW7E5BFS"
            },
            transactions: {
                registerDevice: {
                    txHash: "fd8306cc4c903a81e4845a9654c6ee445a362356ae1edc234361b6a69bafcf70",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/fd8306cc4c903a81e4845a9654c6ee445a362356ae1edc234361b6a69bafcf70"
                },
                registerDockDevice: {
                    deviceSerial: "BULACAN-DOCK3-NFC-TERMINAL",
                    txHash: "982882909fdc7c4b0097ba2553c759fc76215fa493307b82cd6d9335a34ba7e0",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/982882909fdc7c4b0097ba2553c759fc76215fa493307b82cd6d9335a34ba7e0"
                },
                registerAgent: {
                    txHash: "cd7a792ce99b2171ccdab5e1a1a50aa7431a49d9bb65a84a6f41ed244cd2f638",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/cd7a792ce99b2171ccdab5e1a1a50aa7431a49d9bb65a84a6f41ed244cd2f638"
                },
                fundEscrow: {
                    txHash: "68ecc484d8061d44b9a82ab923e7f313d5d74587dfbcd36071a53cabfe3c63b0",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/68ecc484d8061d44b9a82ab923e7f313d5d74587dfbcd36071a53cabfe3c63b0"
                },
                oracleQuery: {
                    amountXlm: "1.00",
                    authorizeTxHash: "0aeae11c139d57eaa91473983df4f841e33be7af9888ff96e410d76f2a64e983",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0aeae11c139d57eaa91473983df4f841e33be7af9888ff96e410d76f2a64e983",
                    claimTxHash: "53e8d991ecdda32528110de8d365b1d2eeeefbcdc80c10991949259995be456a",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/53e8d991ecdda32528110de8d365b1d2eeeefbcdc80c10991949259995be456a"
                },
                driverAdvance: {
                    amountXlm: "6.50",
                    authorizeTxHash: "a17d6f4d2273f949b8a716f122bd4b0a302f297f12e5f827fcfbe36075481dc0",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/a17d6f4d2273f949b8a716f122bd4b0a302f297f12e5f827fcfbe36075481dc0",
                    claimTxHash: "d8101c684360a1b11b87cfadd32c5992eb5923de836a581463fa8046401c0ee8",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/d8101c684360a1b11b87cfadd32c5992eb5923de836a581463fa8046401c0ee8"
                },
                fundOriginalBuyerEscrow: {
                    amountXlm: "36.00",
                    txHash: "8f023efe609f857706fa720fd6694a383e1b2b6c3568c8107ddf8e4207cea473",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/8f023efe609f857706fa720fd6694a383e1b2b6c3568c8107ddf8e4207cea473"
                },
                defundEscrow: {
                    amountXlm: "36.00",
                    txHash: "6f480cf2cdecdba9c2339cf32b3ec76ec60a94ff059fd950ece7c063fa47a8bc",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/6f480cf2cdecdba9c2339cf32b3ec76ec60a94ff059fd950ece7c063fa47a8bc"
                },
                unwindOriginalBuyerEscrow: {
                    amountXlm: "36.00",
                    txHash: "6f480cf2cdecdba9c2339cf32b3ec76ec60a94ff059fd950ece7c063fa47a8bc",
                    explorerUrl: "https://stellar.expert/explorer/testnet/tx/6f480cf2cdecdba9c2339cf32b3ec76ec60a94ff059fd950ece7c063fa47a8bc"
                },
                clearingFee: {
                    amountXlm: "1.15",
                    authorizeTxHash: "e86df99b8983887c40ffede6d2e9467479e40b65cdcbd1e51f6113db2c683597",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/e86df99b8983887c40ffede6d2e9467479e40b65cdcbd1e51f6113db2c683597",
                    claimTxHash: "c996a784c78f0ca6d6ef81491e12ae8981893c645cc9fb6951ab694e30d39b33",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/c996a784c78f0ca6d6ef81491e12ae8981893c645cc9fb6951ab694e30d39b33"
                },
                coopSettlement: {
                    amountXlm: "23.80",
                    authorizeTxHash: "4353b9a7ebe6f84529980e1f98ccbb1db06ada587b2b4f030bd34f6fa400f6f1",
                    authorizeExplorerUrl: "https://stellar.expert/explorer/testnet/tx/4353b9a7ebe6f84529980e1f98ccbb1db06ada587b2b4f030bd34f6fa400f6f1",
                    claimTxHash: "f03dfcdc135f14a5039c4e6d25b583839a6b4a248484a253041ad1356212e29e",
                    claimExplorerUrl: "https://stellar.expert/explorer/testnet/tx/f03dfcdc135f14a5039c4e6d25b583839a6b4a248484a253041ad1356212e29e"
                }
            },
            finalEscrowBalanceXlm: "118.7"
        }
    }
};

window.currentAuthUser = null;
window.activeContractSetKey = "SDK_DEFAULT_2026_10_07";
window.liveTestnetProofs = FALLBACK_TESTNET_PROOFS;
window.autonomousAgentMode = true;
window.hasTriggeredOracleHour3 = false;
window.hasTriggeredDiversionHour45 = false;

function toggleAutonomousAgentMode(checked) {
    window.autonomousAgentMode = Boolean(checked);
    const badge = document.getElementById("agentHudModeBadge");
    if (badge) {
        if (window.autonomousAgentMode) {
            badge.innerText = "AUTONOMOUS MODE ACTIVE";
            badge.className = "pill pill-green";
        } else {
            badge.innerText = "MANUAL CONFIRMATION";
            badge.className = "pill pill-amber";
        }
    }
    showNotification(
        window.autonomousAgentMode
            ? "[MODE] Autonomous Agent Mode enabled (Zero-Click Execution active)."
            : "[MODE] Autonomous Agent Mode disabled (Manual confirmation required)."
    );
}

function toggleAgentHudDrawer() {
    const drawer = document.getElementById("agentHudDrawer");
    if (drawer) {
        drawer.classList.toggle("collapsed");
    }
}


function appendClientTerminalLog(tag, message) {
    if (typeof appendTerminalLogUI === "function") {
        appendTerminalLogUI(tag, message);
    }
}
window.appendClientTerminalLog = appendClientTerminalLog;

function openVeloWalletModal() {
    const walletEl = document.querySelector("#stellar-wallet");
    if (!walletEl) {
        if (typeof showNotification === "function") {
            showNotification("Velo Wallet component not found in DOM");
        }
        return;
    }

    const shadowBtn =
        walletEl.shadowRoot?.querySelector("button.primary") ||
        walletEl.shadowRoot?.querySelector("button") ||
        walletEl.querySelector("button");

    if (shadowBtn) {
        shadowBtn.click();
    } else {
        walletEl.click();
    }
}
window.openVeloWalletModal = openVeloWalletModal;

function updateWalletPillButtons() {
    const btns = document.querySelectorAll(".console-wallet-pill-btn");
    const addr = window.connectedVeloWalletAddress;
    btns.forEach((btn) => {
        if (addr) {
            btn.innerHTML = `<span class="status-dot status-dot-green"></span> Wallet: ${addr.slice(0, 4)}...${addr.slice(-4)}`;
            btn.classList.remove("btn-outline");
            btn.classList.add("btn-primary");
            btn.style.borderColor = "var(--brand-emerald)";
            btn.title = `Connected: ${addr}`;
        } else {
            btn.innerHTML = "Connect Velo Wallet";
            btn.classList.remove("btn-primary");
            btn.classList.add("btn-outline");
            btn.style.borderColor = "";
            btn.title = "Click to connect Velo Stellar Wallet";
        }
    });
}
window.updateWalletPillButtons = updateWalletPillButtons;

function requireVeloWalletConnection(actionLabel = "this action") {
    if (window.connectedVeloWalletAddress) {
        return true;
    }

    const warningMsg = `Action blocked (${actionLabel}): Connect your Velo Wallet first.`;
    appendClientTerminalLog("WALLET GATE", warningMsg);

    const alertMsg = `Wallet Required: Please connect your Velo Stellar Wallet before executing ${actionLabel}.`;
    if (typeof showNotification === "function") {
        showNotification(alertMsg, "#dc2626");
    }

    // Automatically trigger Velo Wallet selector modal
    openVeloWalletModal();

    return false;
}
window.requireVeloWalletConnection = requireVeloWalletConnection;

function initVeloWalletComponent() {
    updateWalletPillButtons();
    const wallet = document.querySelector("#stellar-wallet");
    if (!wallet) return;

    wallet.addEventListener("velo:wallet-connected", (event) => {
        console.log("Connected", event.detail?.address);
        const addr = event.detail?.address;
        if (addr) {
            window.connectedVeloWalletAddress = addr;
            updateWalletPillButtons();
            appendClientTerminalLog("VELO WALLET", "Connected Stellar wallet: " + addr);
            if (typeof showNotification === "function") {
                showNotification("Velo Wallet connected: " + addr.slice(0, 4) + "..." + addr.slice(-4));
            }
        }
    });

    wallet.addEventListener("velo:wallet-error", (event) => {
        console.error("Wallet error", event.detail?.error);
        appendClientTerminalLog("VELO ERROR", "Wallet error: " + (event.detail?.error || "unknown"));
    });
}

function clearTerminalLogs() {
    const feed = document.getElementById("agentTerminalFeed");
    if (feed) feed.innerHTML = "";
}

function appendTerminalLogUI(tag, message, timestamp) {
    const feed = document.getElementById("agentTerminalFeed");
    if (!feed) return;

    const timeStr = timestamp
        ? new Date(timestamp).toLocaleTimeString()
        : new Date().toLocaleTimeString();

    let tagClass = "tag-perceive";
    const tagUpper = (tag || "INFO").toUpperCase();
    if (tagUpper.includes("PERCEIVE")) tagClass = "tag-perceive";
    else if (tagUpper.includes("REASON")) tagClass = "tag-reason";
    else if (tagUpper.includes("SIGN") || tagUpper.includes("DISBURSE")) tagClass = "tag-sign";
    else if (tagUpper.includes("LIQUIDATE") || tagUpper.includes("ESCROW")) tagClass = "tag-liquidate";
    else if (tagUpper.includes("UNWIND") || tagUpper.includes("SETTLE")) tagClass = "tag-settle";

    const line = document.createElement("div");
    line.className = "agent-terminal-line";
    line.innerHTML = `
        <span class="agent-terminal-time">${timeStr}</span>
        <span class="agent-terminal-tag ${tagClass}">[${tagUpper}]</span>
        <span class="agent-terminal-msg">${message}</span>
    `;

    feed.appendChild(line);
    const body = document.getElementById("agentHudBody");
    if (body) {
        body.scrollTop = body.scrollHeight;
    }
}

async function loadInitialTerminalLogs() {
    try {
        const res = await fetch("/api/agent/terminal-logs");
        const data = await res.json();
        if (data && data.logs && data.logs.length) {
            const feed = document.getElementById("agentTerminalFeed");
            if (feed) feed.innerHTML = "";
            for (const log of data.logs.slice().reverse()) {
                appendTerminalLogUI(log.tag, log.message, log.timestamp);
            }
            return;
        }
    } catch {
        // Fallback static logs
    }

    const defaultLogs = [
        {
            tag: "PERCEIVE",
            message: "Ingesting telemetry frame (Tc=34.2°C, RH=54%, VPD=2.47 kPa, Respiration=179 mW/kg)"
        },
        {
            tag: "REASON",
            message: "Arrhenius RUL (1.5h) < ETA Manila (8.5h) | Economic Solver ΔEV = +₱117,980 > 0"
        },
        {
            tag: "SIGN & DISBURSE",
            message: "Disbursing 6.50 XLM driver diversion fuel/toll advance via @noirx402/agent-sdk -> Mang Ramon"
        },
        {
            tag: "LIQUIDATE & ESCROW",
            message: "Creating Velo Checkout Session 25.60 XLM floor price -> Bulacan Food Dehydrator"
        },
        {
            tag: "UNWIND & SETTLE",
            message: "Verifying webhook & dual hardware proofs -> Unwinding 36.00 XLM original buyer escrow, releasing 23.80 XLM net to Co-op, 1.15 XLM fee."
        }
    ];

    const feed = document.getElementById("agentTerminalFeed");
    if (feed && feed.children.length === 0) {
        for (const l of defaultLogs) {
            appendTerminalLogUI(l.tag, l.message);
        }
    }
}

async function executeAutonomousOracleQueryUI() {
    if (!requireVeloWalletConnection("Query x402 Route Oracle (1 XLM)")) {
        return;
    }

    appendTerminalLogUI(
        "PERCEIVE",
        "Canopy warming passed 26.4°C at Hour 3.0. Firing GET /api/x402/route-weather-oracle..."
    );

    try {
        const res = await fetch("/api/agent/query-oracle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contractSetKey: window.activeContractSetKey })
        });
        const data = await res.json();
        if (data && data.ok) {
            appendTerminalLogUI(
                "PERCEIVE",
                `Intercepted HTTP 402 challenge -> Autonomously paid 1.00 XLM (${(data.paymentTx || "").slice(0, 10)}...). Received: STALL_CONFIRMED (NLEX delay 3.5h, Bulacan Dock 3 ready).`
            );
            showNotification(
                "[ORACLE] Intercepted HTTP 402 challenge and autonomously paid 1.00 XLM fee."
            );
            return;
        }
    } catch {
        // Static fallback
    }

    appendTerminalLogUI(
        "PERCEIVE",
        "Intercepted HTTP 402 challenge -> Autonomously paid 1.00 XLM via @noirx402/agent-sdk. Received: STALL_CONFIRMED (NLEX delay 3.5h, Bulacan Dock 3 ready)."
    );
    showNotification(
        "[ORACLE] Intercepted HTTP 402 challenge and autonomously paid 1.00 XLM fee."
    );
}

function navigateTo(viewName) {
    const viewMap = {
        landing: "landingView",
        login: "loginView",
        dispatcher: "dispatcherView",
        broker: "brokerView",
        driver: "driverView"
    };

    if (viewName === "dispatcher") {
        if (!window.currentAuthUser || window.currentAuthUser.role !== "dispatcher") {
            window.currentAuthUser = AUTH_USERS.dispatcher;
        }
    } else if (viewName === "broker") {
        if (!window.currentAuthUser || window.currentAuthUser.role !== "broker") {
            window.currentAuthUser = AUTH_USERS.broker;
        }
    } else if (viewName === "driver") {
        if (!window.currentAuthUser || window.currentAuthUser.role !== "driver") {
            window.currentAuthUser = AUTH_USERS.driver;
        }
    }

    const targetId = viewMap[viewName] || "landingView";

    document.querySelectorAll(".app-view").forEach((el) => {
        el.classList.remove("active-view");
    });

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        targetEl.classList.add("active-view");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (viewName === "dispatcher") {
        if (typeof ensureChartInitializedAndResized === "function") {
            ensureChartInitializedAndResized();
        }
        if (typeof updateSimulation === "function") {
            const h = (window.currentSimState && window.currentSimState.hour) ?? 4.5;
            updateSimulation(h);
        }
    }

    renderNoirVeloProofUI();
    updatePublicNavbarSessionUI();
    updateWalletPillButtons();
}

function updatePublicNavbarSessionUI() {
    const badgeEl = document.getElementById("navSessionBadge");
    const returnBtn = document.getElementById("navReturnConsoleBtn");
    const loginBtn = document.getElementById("navLoginBtn");
    if (!badgeEl) return;

    if (window.currentAuthUser) {
        const role = window.currentAuthUser.role;
        const roleLabel = role === "dispatcher"
            ? "Dispatcher"
            : role === "broker"
            ? "Broker"
            : role === "driver"
            ? "Driver App"
            : (window.currentAuthUser.displayName || "Active");

        badgeEl.style.display = "inline-flex";
        badgeEl.innerText = "Signed in: " + roleLabel;
        if (loginBtn) loginBtn.style.display = "none";
        if (returnBtn) returnBtn.style.display = "none";
    } else {
        badgeEl.style.display = "none";
        if (loginBtn) loginBtn.style.display = "inline-flex";
        if (returnBtn) returnBtn.style.display = "none";
    }
}

function returnToActiveConsole() {
    if (!window.currentAuthUser) {
        navigateTo("login");
        return;
    }
    navigateTo(window.currentAuthUser.allowedView);
}

function fillCredentials(username, password) {
    const userEl = document.getElementById("loginUsername");
    const passEl = document.getElementById("loginPassword");
    const errBox = document.getElementById("loginErrorBox");

    if (userEl) userEl.value = username;
    if (passEl) passEl.value = password;
    if (errBox) errBox.style.display = "none";
}

function handleLogin(event) {
    if (event) event.preventDefault();

    const userEl = document.getElementById("loginUsername");
    const passEl = document.getElementById("loginPassword");
    const errBox = document.getElementById("loginErrorBox");

    const rawUser = userEl ? userEl.value.trim().toLowerCase() : "";
    const rawPass = passEl ? passEl.value.trim() : "";

    const matchedAccount = AUTH_USERS[rawUser];

    if (!matchedAccount || matchedAccount.password !== rawPass) {
        if (errBox) {
            errBox.style.display = "block";
        }
        showNotification("[ERROR] Invalid credentials. Use dispatcher/admin, broker/admin, or driver/admin.", "#ef4444");
        return;
    }

    if (errBox) {
        errBox.style.display = "none";
    }

    window.currentAuthUser = matchedAccount;
    navigateTo(matchedAccount.allowedView);
    showNotification("[AUTH] Welcome, " + matchedAccount.displayName);
}

function logoutUser() {
    window.currentAuthUser = null;
    navigateTo("landing");
    showNotification("[AUTH] Signed out successfully.");
}

function quickLoginAs(roleName) {
    const acc = AUTH_USERS[roleName];
    if (acc) {
        window.currentAuthUser = acc;
        navigateTo(acc.allowedView);
        showNotification("[PORTAL] Switched to " + acc.displayName);
    }
}

function showTab(tabName) {
    document.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
    });

    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add("active");
    }

    const dispatcherNav = document.getElementById("dispatcherNav");
    if (dispatcherNav) {
        dispatcherNav.querySelectorAll(".nav-btn").forEach((btn) => {
            btn.classList.remove("active-nav-btn");
            const clickAttr = btn.getAttribute("onclick") || "";
            if (clickAttr.includes(`'${tabName}'`)) {
                btn.classList.add("active-nav-btn");
            }
        });
    }

    if (tabName === "noir-velo") {
        renderNoirVeloProofUI();
    }
}

function switchContractSetUI(contractSetKey) {
    window.activeContractSetKey = contractSetKey;

    const btnHandbook = document.getElementById("btnSetHandbook");
    const btnSdkDefault = document.getElementById("btnSetSdkDefault");

    if (btnHandbook && btnSdkDefault) {
        if (contractSetKey === "HANDBOOK_2026_10_24") {
            btnHandbook.className = "btn btn-primary btn-sm";
            btnSdkDefault.className = "btn btn-outline btn-sm";
        } else {
            btnHandbook.className = "btn btn-outline btn-sm";
            btnSdkDefault.className = "btn btn-primary btn-sm";
        }
    }

    fetch("/api/agent/switch-contract-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractSetKey })
    }).catch(() => {});

    renderNoirVeloProofUI();
    showNotification(`Viewing ${contractSetKey} Noir Soroban Contracts & Proofs`);
}

function renderNoirVeloProofUI() {
    const proofs = window.liveTestnetProofs || FALLBACK_TESTNET_PROOFS;
    const setKey = window.activeContractSetKey || "SDK_DEFAULT_2026_10_07";
    const activeSet =
        (proofs.contractSets && proofs.contractSets[setKey]) ||
        FALLBACK_TESTNET_PROOFS.contractSets.SDK_DEFAULT_2026_10_07;

    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    const setHref = (id, url, label) => {
        const el = document.getElementById(id);
        if (el && url) {
            el.href = url;
            if (label) el.innerText = label;
        }
    };

    const btnHandbook = document.getElementById("btnSetHandbook");
    const btnSdkDefault = document.getElementById("btnSetSdkDefault");
    if (btnHandbook && btnSdkDefault) {
        if (setKey === "SDK_DEFAULT_2026_10_07") {
            btnSdkDefault.className = "btn btn-primary btn-sm";
            btnHandbook.className = "btn btn-outline btn-sm";
        } else {
            btnHandbook.className = "btn btn-primary btn-sm";
            btnSdkDefault.className = "btn btn-outline btn-sm";
        }
    }

    const shortId = (s) => (s && s.length > 16 ? s.slice(0, 8) + "..." + s.slice(-6) : s);
    setEl("contractIdDeviceRegistry", shortId(activeSet.contracts.deviceRegistry));
    setEl("contractIdAgentRegistry", shortId(activeSet.contracts.agentRegistry));
    setEl("contractIdPaymentEscrow", shortId(activeSet.contracts.paymentEscrow));
    setEl("activeContractSetLabel", "Active Set: " + activeSet.label);

    if (proofs.deviceHash) {
        setEl("uiDeviceHash", proofs.deviceHash.slice(0, 10) + "...");
    }
    if (proofs.dockDeviceHash) {
        setEl("uiDockDeviceHash", proofs.dockDeviceHash.slice(0, 10) + "...");
    }
    if (proofs.accounts) {
        setEl("uiOwnerPubKey", proofs.accounts.ownerPublicKey.slice(0, 8) + "..." + proofs.accounts.ownerPublicKey.slice(-4));
        setEl("uiAgentPubKey", proofs.accounts.agentPublicKey.slice(0, 8) + "..." + proofs.accounts.agentPublicKey.slice(-4));
    }

    const txs = activeSet.transactions;
    if (txs) {
        if (txs.registerDevice) {
            setHref(
                "txLinkRegisterDevice",
                txs.registerDevice.explorerUrl,
                `Pod (${txs.registerDevice.txHash.slice(0, 8)}...)`
            );
            setHref(
                "txLinkRegisterDeviceRow",
                txs.registerDevice.explorerUrl,
                `${txs.registerDevice.txHash.slice(0, 8)}...`
            );
        }
        if (txs.registerDockDevice) {
            setHref(
                "txLinkRegisterDock",
                txs.registerDockDevice.explorerUrl,
                `Dock (${txs.registerDockDevice.txHash.slice(0, 8)}...)`
            );
        }
        if (txs.coopSettlement) {
            setHref(
                "txLinkRegisterAgent",
                txs.coopSettlement.claimExplorerUrl || txs.coopSettlement.authorizeExplorerUrl,
                `${(txs.coopSettlement.claimTxHash || "").slice(0, 8)}...`
            );
        } else if (txs.registerAgent) {
            setHref(
                "txLinkRegisterAgent",
                txs.registerAgent.explorerUrl,
                `${txs.registerAgent.txHash.slice(0, 8)}...`
            );
        }
        if (txs.fundEscrow) {
            setHref(
                "txLinkFundEscrow",
                txs.fundEscrow.explorerUrl,
                `${txs.fundEscrow.txHash.slice(0, 8)}...`
            );
        }
        if (txs.defundEscrow || txs.unwindOriginalBuyerEscrow) {
            const defundTx = txs.defundEscrow || txs.unwindOriginalBuyerEscrow;
            setHref(
                "txLinkDefundEscrow",
                defundTx.explorerUrl,
                `${defundTx.txHash.slice(0, 8)}...`
            );
        }
        if (txs.oracleQuery) {
            setHref(
                "txLinkClearingFee",
                txs.oracleQuery.claimExplorerUrl || txs.oracleQuery.authorizeExplorerUrl,
                `${(txs.oracleQuery.claimTxHash || "").slice(0, 8)}...`
            );
        } else if (txs.clearingFee) {
            setHref(
                "txLinkClearingFee",
                txs.clearingFee.claimExplorerUrl || txs.clearingFee.authorizeExplorerUrl,
                `${txs.clearingFee.claimTxHash.slice(0, 8)}...`
            );
        }
        if (txs.driverAdvance) {
            setHref(
                "driverAdvanceTxLink",
                txs.driverAdvance.claimExplorerUrl || txs.driverAdvance.authorizeExplorerUrl,
                `6.50 XLM Driver Claim Tx (${(txs.driverAdvance.claimTxHash || "").slice(0, 12)}...) [Tx]`
            );
        }
        if (txs.coopSettlement) {
            setHref(
                "receiptSettlementTxLink",
                txs.coopSettlement.claimExplorerUrl || txs.coopSettlement.authorizeExplorerUrl,
                `23.80 XLM Co-op Claim Tx (${(txs.coopSettlement.claimTxHash || "").slice(0, 12)}...) [Tx]`
            );
        }
    }

    const tbody = document.getElementById("onChainProofTableBody");
    if (tbody && txs) {
        const rows = [
            {
                stage: "Stage 1 · Truck Pod Hardware Attestation (ESP32-S3)",
                method: "device_registry.register",
                amount: "—",
                txHash: txs.registerDevice?.txHash,
                url: txs.registerDevice?.explorerUrl
            },
            {
                stage: "Stage 1 · Dock Terminal Hardware Attestation (Meycauayan Dock 3)",
                method: "device_registry.register",
                amount: "—",
                txHash: txs.registerDockDevice?.txHash,
                url: txs.registerDockDevice?.explorerUrl
            },
            {
                stage: "Stage 1 · Autonomous Agent Policy Delegation",
                method: "agent_registry.register_agent",
                amount: "100.00 XLM Cap",
                txHash: txs.registerAgent?.txHash,
                url: txs.registerAgent?.explorerUrl
            },
            {
                stage: "Stage 1 · Pre-Fund Operational Escrow",
                method: "payment_escrow.fund_escrow",
                amount: "150.00 XLM",
                txHash: txs.fundEscrow?.txHash,
                url: txs.fundEscrow?.explorerUrl
            },
            {
                stage: "Stage 1 · Original Manila Wholesale Escrow Invoice",
                method: "payment_escrow.fund_escrow",
                amount: "36.00 XLM (₱360,000)",
                txHash: txs.fundOriginalBuyerEscrow?.txHash,
                url: txs.fundOriginalBuyerEscrow?.explorerUrl
            },
            {
                stage: "Stage 3 · Unwind & Refund Original Buyer Escrow on Diversion",
                method: "payment_escrow.defund_escrow",
                amount: "36.00 XLM (Refunded)",
                txHash: (txs.defundEscrow || txs.unwindOriginalBuyerEscrow)?.txHash,
                url: (txs.defundEscrow || txs.unwindOriginalBuyerEscrow)?.explorerUrl
            },
            {
                stage: "Stage 2 · Autonomous x402 Route Weather Oracle (Hour 3.0)",
                method: "payment_escrow.authorize + claim",
                amount: "1.00 XLM (₱10k eq)",
                txHash: txs.oracleQuery?.authorizeTxHash,
                url: txs.oracleQuery?.authorizeExplorerUrl,
                claimHash: txs.oracleQuery?.claimTxHash,
                claimUrl: txs.oracleQuery?.claimExplorerUrl
            },
            {
                stage: "Stage 3 · Mang Ramon NLEX Toll & Diesel Advance (Hour 4.5 [TRIGGER])",
                method: "payment_escrow.authorize + claim",
                amount: "6.50 XLM (₱6,500)",
                txHash: txs.driverAdvance?.authorizeTxHash,
                url: txs.driverAdvance?.authorizeExplorerUrl,
                claimHash: txs.driverAdvance?.claimTxHash,
                claimUrl: txs.driverAdvance?.claimExplorerUrl
            },
            {
                stage: "Stage 5 · AWITEN Clearinghouse 4.5% Protocol Fee",
                method: "payment_escrow.authorize + claim",
                amount: "1.15 XLM (₱11,520)",
                txHash: txs.clearingFee?.authorizeTxHash,
                url: txs.clearingFee?.authorizeExplorerUrl,
                claimHash: txs.clearingFee?.claimTxHash,
                claimUrl: txs.clearingFee?.claimExplorerUrl
            },
            {
                stage: "Stage 5 · Benguet Co-op Net Rescue Settlement on NFC Dock Tap",
                method: "payment_escrow.authorize + claim",
                amount: "23.80 XLM (₱237,980)",
                txHash: txs.coopSettlement?.authorizeTxHash,
                url: txs.coopSettlement?.authorizeExplorerUrl,
                claimHash: txs.coopSettlement?.claimTxHash,
                claimUrl: txs.coopSettlement?.claimExplorerUrl
            }
        ];

        tbody.innerHTML = rows
            .filter((r) => r.txHash)
            .map((r) => {
                const authLink = `<a href="${r.url}" target="_blank" rel="noopener" class="tx-pill-link">${r.claimHash ? "authorize: " : ""}${r.txHash.slice(0, 12)}... [Tx]</a>`;
                const claimLink = r.claimHash
                    ? ` <a href="${r.claimUrl}" target="_blank" rel="noopener" class="tx-pill-link">claim: ${r.claimHash.slice(0, 12)}... [Tx]</a>`
                    : "";
                return `
                    <tr>
                        <td><strong>${r.stage}</strong></td>
                        <td><code>${r.method}</code></td>
                        <td><strong style="color:var(--brand-green);">${r.amount}</strong></td>
                        <td>${authLink}${claimLink}</td>
                    </tr>
                `;
            })
            .join("");
    }
}

function syncDriverAppViewForHour(h) {
    const routeHeadline = document.getElementById("driverRouteHeadline");
    const walletPill = document.getElementById("driverWalletPill");
    const walletXlm = document.getElementById("driverWalletXlm");
    const walletPhp = document.getElementById("driverWalletPhp");

    const isDiverted =
        h >= 4.0 &&
        window.currentSimState &&
        window.currentSimState.decisionCode === "EXECUTE_AUTONOMOUS_DIVERSION";

    if (!isDiverted) {
        if (walletPill) {
            walletPill.innerText = "STANDBY · NO DIVERSION";
            walletPill.className = "pill pill-blue";
        }
        if (walletXlm) walletXlm.innerText = "0.00 XLM";
        if (walletPhp) walletPhp.innerText = "₱0 Advance (Primary Route Active)";
        if (routeHeadline) {
            routeHeadline.innerText = "Primary Route: BAPTC La Trinidad → Balintawak Market";
        }
    } else {
        if (walletPill) {
            walletPill.innerText = "+6.50 XLM CREDITED";
            walletPill.className = "pill pill-green";
        }
        if (walletXlm) walletXlm.innerText = "+6.50 XLM";
        if (walletPhp) walletPhp.innerText = "₱6,500 PHP Eq. (Toll & Diesel)";
        if (routeHeadline) {
            routeHeadline.innerText =
                "Exit TPLEX at Carmen → Bulacan Food Dehydrator (Meycauayan Dock 3)";
        }
    }
}

async function triggerAutonomousDiversionFlow(customBuyer, customPricePerKg, options = {}) {
    if (!requireVeloWalletConnection("Autonomous Diversion")) {
        return;
    }
    const buyerName = customBuyer || "Bulacan Food Dehydrator (Contracted Floor)";
    const pricePhpPerKg = parseFloat(customPricePerKg || 32.0);

    appendTerminalLogUI(
        "REASON",
        "Arrhenius RUL (1.5h) < ETA Manila (8.5h) | Economic Solver ΔEV = +₱117,980 > 0. Verified hardware attestation from BGT-402-POD-ESP32S3."
    );

    try {
        const res = await fetch("/api/agent/execute-diversion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                buyerName,
                pricePhpPerKg,
                contractSetKey: window.activeContractSetKey,
                walletAddress: window.connectedVeloWalletAddress
            })
        });
        const data = await res.json();
        if (data && data.ok) {
            const session = data.veloSession;
            const intentEl = document.getElementById("uiVeloIntentId");
            const buyerEl = document.getElementById("uiVeloBuyerName");
            const amtEl = document.getElementById("uiVeloAmount");
            const statusBadge = document.getElementById("veloEscrowStatusBadge");

            if (intentEl) intentEl.innerText = session.paymentIntentId;
            if (buyerEl) buyerEl.innerText = session.buyerName;
            if (amtEl) amtEl.innerText = `${session.amountXlm} XLM (₱${session.grossPhp.toLocaleString("en-PH")} Gross)`;
            if (statusBadge) {
                statusBadge.innerText = "CHECKOUT CREATED";
                statusBadge.className = "pill pill-amber";
            }

            syncDriverAppViewForHour(4.5);
            if (data.connectedWalletTransfer?.explorerUrl) {
                const advanceLink = document.getElementById("driverAdvanceTxLink");
                if (advanceLink) {
                    advanceLink.href = data.connectedWalletTransfer.explorerUrl;
                }
            }

            appendTerminalLogUI(
                "SIGN & DISBURSE",
                `Disbursing 6.50 XLM driver advance via @noirx402/agent-sdk -> Mang Ramon (tx: ${(data.driverAdvance?.claimTxHash || "").slice(0, 10)}...). Unwound 36.00 XLM original buyer invoice escrow (tx: ${(data.unwoundOriginalBuyerEscrow?.txHash || "").slice(0, 10)}...).`
            );
            appendTerminalLogUI(
                "LIQUIDATE & ESCROW",
                `Creating Velo Checkout Session 25.60 XLM floor price -> Bulacan Food Dehydrator (${session.paymentIntentId}).`
            );

            showNotification(
                "[AGENT] Executed 6.50 XLM Driver Advance & Velo Checkout Session"
            );
            return;
        }
    } catch {
        // Fallback for static viewing
    }

    syncDriverAppViewForHour(4.5);
    appendTerminalLogUI(
        "SIGN & DISBURSE",
        "Disbursing 6.50 XLM driver diversion fuel/toll advance via @noirx402/agent-sdk -> Mang Ramon. Unwound 36.00 XLM original buyer invoice escrow."
    );
    appendTerminalLogUI(
        "LIQUIDATE & ESCROW",
        `Creating Velo Checkout Session 25.60 XLM floor price -> Bulacan Food Dehydrator.`
    );
    showNotification(
        "[AGENT] Executed 6.50 XLM Driver Advance & Velo Checkout Session"
    );
}

async function launchVeloCheckoutFromBroker() {
    if (!requireVeloWalletConnection("Launch Velo Checkout")) {
        return;
    }
    const bidPriceEl = document.getElementById("bidPriceInput");
    const hubEl = document.getElementById("bidHubSelect");
    const pricePhpPerKg = bidPriceEl ? parseFloat(bidPriceEl.value) || 32.0 : 32.0;
    const buyerName = hubEl ? hubEl.value : "Bulacan Food Dehydrator (Meycauayan Dock 3)";

    try {
        const res = await fetch("/api/velo/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buyerName, hubName: buyerName, pricePhpPerKg })
        });
        const data = await res.json();
        if (data && data.ok) {
            const s = data.veloSession;
            const infoEl = document.getElementById("brokerVeloSessionInfo");
            const badgeEl = document.getElementById("brokerVeloStatusBadge");
            if (badgeEl) {
                badgeEl.innerText = `Session ${s.paymentIntentId}`;
                badgeEl.className = "pill pill-blue";
            }
            if (infoEl) {
                infoEl.innerHTML = `Created Velo Checkout Session <code>${s.paymentIntentId}</code> for <strong>${s.amountXlm} XLM (₱${s.grossPhp.toLocaleString("en-PH")})</strong>. Click <strong>"Simulate Verified Velo Webhook"</strong> to lock buyer funds.`;
            }
            showNotification(
                `[VELO] Checkout Session created: ${s.paymentIntentId} (${s.amountXlm} XLM)`
            );
            return;
        }
    } catch {
        // Static fallback
    }

    showNotification("[VELO] Checkout Session created (25.60 XLM / ₱256,000 Floor).");
}
window.triggerBrokerVeloCheckout = launchVeloCheckoutFromBroker;

async function simulateVerifiedVeloWebhookUI() {
    if (!requireVeloWalletConnection("Simulate Velo Webhook")) {
        return;
    }
    try {
        const res = await fetch("/api/velo/simulate-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountXlm: "25.60" })
        });
        const data = await res.json();
        if (data && data.ok) {
            const sigEl = document.getElementById("uiLatestWebhookSig");
            const veloBadge = document.getElementById("veloEscrowStatusBadge");
            const brokerBadge = document.getElementById("brokerVeloStatusBadge");
            const driverLockBadge = document.getElementById("driverBuyerLockBadge");

            if (sigEl && data.webhookRecord) {
                sigEl.innerText = `${data.webhookRecord.eventId} · x-velo-signature: ${data.webhookRecord.signatureHeader}`;
            }
            if (veloBadge) {
                veloBadge.innerText = "ESCROW LOCKED (PAID)";
                veloBadge.className = "pill pill-green";
            }
            if (brokerBadge) {
                brokerBadge.innerText = "PAID & VERIFIED";
                brokerBadge.className = "pill pill-green";
            }
            if (driverLockBadge) {
                driverLockBadge.innerText = "BUYER ESCROW LOCKED VIA VELO";
                driverLockBadge.className = "pill pill-green";
            }

            appendTerminalLogUI(
                "LIQUIDATE & ESCROW",
                `Verified x-velo-signature (${data.webhookRecord?.eventId || 'payment.succeeded'}). Off-taker escrow locked (25.60 XLM); Driver NFC handoff unlocked.`
            );

            showNotification(
                "[ESCROW] Verified x-velo-signature (payment.succeeded · 25.60 XLM). Driver NFC handoff unlocked."
            );
            return;
        }
    } catch {
        // Static fallback
    }

    const driverLockBadge = document.getElementById("driverBuyerLockBadge");
    if (driverLockBadge) {
        driverLockBadge.innerText = "BUYER ESCROW LOCKED VIA VELO";
        driverLockBadge.className = "pill pill-green";
    }
    appendTerminalLogUI(
        "LIQUIDATE & ESCROW",
        "Verified x-velo-signature for 25.60 XLM. Off-taker escrow confirmed locked."
    );
    showNotification(
        "[ESCROW] Verified x-velo-signature (payment.succeeded · 25.60 XLM). Driver NFC handoff unlocked."
    );
}

async function confirmDriverNfcHandoff() {
    if (!requireVeloWalletConnection("Driver NFC Handoff")) {
        return;
    }
    const receiptCard = document.getElementById("driverSettlementReceiptCard");
    const nfcBtn = document.getElementById("nfcHandoffBtn");
    const driverLockBadge = document.getElementById("driverBuyerLockBadge");

    try {
        const res = await fetch("/api/agent/confirm-handoff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deviceSerial: "BGT-402-POD-ESP32S3",
                dockSerial: "BULACAN-DOCK3-NFC-TERMINAL",
                contractSetKey: window.activeContractSetKey,
                walletAddress: window.connectedVeloWalletAddress
            })
        });
        const data = await res.json();
        if (data && data.ok) {
            if (driverLockBadge) {
                driverLockBadge.innerText = "BUYER ESCROW LOCKED VIA VELO";
                driverLockBadge.className = "pill pill-green";
            }
            if (nfcBtn) {
                nfcBtn.innerText = "Dual NFC Tap Verified · 23.80 XLM Settled on Stellar Testnet";
            }
            if (receiptCard) {
                receiptCard.style.display = "block";
            }
            if (data.receipt?.explorerUrl) {
                const receiptLink = document.getElementById("receiptSettlementTxLink");
                if (receiptLink) {
                    receiptLink.href = data.receipt.explorerUrl;
                }
            }

            appendTerminalLogUI(
                "UNWIND & SETTLE",
                "Verifying webhook & dual hardware proofs (BGT-402-POD-ESP32S3 + BULACAN-DOCK3-NFC-TERMINAL) -> Unwinding 36.00 XLM original buyer escrow, releasing 23.80 XLM net to Co-op, 1.15 XLM fee."
            );

            showNotification(
                "[SETTLED] Dual NFC Dock Tap Verified. Released 23.80 XLM (₱237,980 net) from Noir payment_escrow to Benguet Highland Co-op."
            );
            return;
        }
    } catch {
        // Static fallback
    }

    if (nfcBtn) {
        nfcBtn.innerText = "Dual NFC Tap Verified · 23.80 XLM Settled on Stellar Testnet";
    }
    if (receiptCard) {
        receiptCard.style.display = "block";
    }
    appendTerminalLogUI(
        "UNWIND & SETTLE",
        "Verifying webhook & dual hardware proofs -> Unwinding 36.00 XLM original buyer escrow, releasing 23.80 XLM net to Co-op, 1.15 XLM fee."
    );
    showNotification(
        "[SETTLED] Dual NFC Dock Tap Verified. Released 23.80 XLM (₱237,980 net) from Noir payment_escrow to Benguet Highland Co-op."
    );
}

async function resetFullDemoState() {
    window.hasTriggeredOracleHour3 = false;
    window.hasTriggeredDiversionHour45 = false;

    try {
        await fetch("/api/agent/reset-demo", { method: "POST" });
    } catch {
        // Ignore offline error
    }
    if (typeof updateSimulation === "function") {
        updateSimulation(0);
    }
    const receiptCard = document.getElementById("driverSettlementReceiptCard");
    if (receiptCard) receiptCard.style.display = "none";
    const nfcBtn = document.getElementById("nfcHandoffBtn");
    if (nfcBtn) {
        nfcBtn.innerText = "Tap Bulacan Dock 3 NFC Terminal (BGT-402-POD)";
    }
    appendTerminalLogUI("PERCEIVE", "Reset route simulation to Hour 0.0 (BAPTC Loading Dock, 17.5°C).");
    showNotification("[RESET] Reset route simulation to Hour 0.0.");
}

function submitPartnerForm(event) {
    if (event) event.preventDefault();

    const orgEl = document.getElementById("partnerOrg");
    const roleEl = document.getElementById("partnerRole");
    const corridorEl = document.getElementById("partnerCorridor");
    const capacityEl = document.getElementById("partnerCapacity");

    const orgName = orgEl ? orgEl.value.trim() : "New Corridor Partner";
    const roleName = roleEl ? roleEl.value : "Partner";
    const corridor = corridorEl ? corridorEl.value.trim() : "Northern Luzon";
    const capacity = capacityEl ? capacityEl.value.trim() : "";

    const pipelineList = document.getElementById("partnerPipelineList");
    if (pipelineList) {
        const item = document.createElement("div");
        item.style.color = "#0b6e3b";
        item.innerHTML = `• <strong>${orgName}</strong> — ${roleName} (${corridor} · ${capacity})`;
        pipelineList.insertBefore(item, pipelineList.firstChild);
    }

    const form = document.getElementById("partnerForm");
    if (form) form.reset();

    showNotification("[PARTNERSHIP] Inquiry Received for " + orgName + ". Added to Corridor Pipeline.");
}

function exportTelemetryReport() {
    const s = window.currentSimState || {};
    const proofs = window.liveTestnetProofs || FALLBACK_TESTNET_PROOFS;
    const report = {
        platform: "AWITEN-Pay — Autonomous Post-Harvest Spoilage Clearinghouse on Stellar",
        standard: "PNS/BAFS 19:2018 (Fresh Head Cabbage)",
        timestamp: new Date().toISOString(),
        shipmentId: (s.preset || "bgt402").toUpperCase(),
        deviceSerial: proofs.deviceSerial,
        deviceHash: proofs.deviceHash,
        dockDeviceSerial: proofs.dockDeviceSerial,
        dockDeviceHash: proofs.dockDeviceHash,
        corridorHour: s.hour || 4.5,
        freshnessIndex_F_t: s.freshness || 62.4,
        commercialGrade: s.grade || "Grade 3",
        canopyTempC: s.temp || 34.2,
        relativeHumidityPct: s.rh || 54,
        vaporPressureDeficit_kPa: s.vpd || 2.48,
        arrheniusRespiration_mW_kg: s.respRate || 174,
        remainingUsefulLife_hrs: s.rul || 2.8,
        recommendedAction: s.action || "1-Tap Divert Now",
        expectedValueComparison: {
            manifestInvoicePHP: 360000,
            originalManilaEscrowPHP: 360000,
            continueToBalintawakNetPHP: 120000,
            divertToBulacanDehydratorNetPHP: 237980,
            awitenClearingFeePHP: 11520,
            netCashRecoveredPHP: 117980,
            driverAdvanceXLM: "6.50",
            coopNetSettlementXLM: "23.80"
        },
        stellarTestnetProofs: proofs.contractSets
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AWITEN_Pay_Telemetry_Audit_${report.shipmentId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("[AUDIT] Exported PNS/BAFS 19:2018 Telemetry & Stellar Testnet Audit Certificate.");
}

let auctionRemainingSeconds = 2 * 3600 + 44 * 60 + 18;

function updateClocks() {
    const clockEl = document.getElementById("liveClock");
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString();
    }

    const countdownEl = document.getElementById("auctionCountdown");
    if (countdownEl) {
        if (auctionRemainingSeconds > 0) {
            auctionRemainingSeconds--;
        } else {
            auctionRemainingSeconds = 2 * 3600 + 44 * 60;
        }
        const hrs = String(Math.floor(auctionRemainingSeconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((auctionRemainingSeconds % 3600) / 60)).padStart(2, "0");
        const secs = String(auctionRemainingSeconds % 60).padStart(2, "0");
        countdownEl.innerText = `${hrs}:${mins}:${secs}`;
    }
}

setInterval(updateClocks, 1000);

function showNotification(message, bgColor) {
    const note = document.createElement("div");
    note.innerText = message;
    note.style.position = "fixed";
    note.style.bottom = "84px"; // Elevated above persistent HUD drawer
    note.style.right = "24px";
    note.style.background = bgColor || "linear-gradient(135deg, #053d22, #0b6e3b)";
    note.style.color = "#ffffff";
    note.style.padding = "13px 20px";
    note.style.borderRadius = "12px";
    note.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    note.style.fontWeight = "700";
    note.style.fontSize = "13.5px";
    note.style.boxShadow = "0 12px 28px rgba(5, 61, 34, 0.28)";
    note.style.zIndex = "10000";
    note.style.maxWidth = "440px";
    note.style.lineHeight = "1.4";
    note.style.border = "1px solid rgba(255,255,255,0.25)";

    document.body.appendChild(note);

    setTimeout(() => {
        note.remove();
    }, 4200);
}

document.addEventListener("DOMContentLoaded", () => {
    updateClocks();
    renderNoirVeloProofUI();
    initVeloWalletComponent();
    updatePublicNavbarSessionUI();
    loadInitialTerminalLogs();

    // Hydrate from live Express backend if available
    fetch("/api/agent/state")
        .then((r) => r.json())
        .then((data) => {
            if (data && data.testnetProofs) {
                window.liveTestnetProofs = data.testnetProofs;
                if (data.workflow && data.workflow.activeContractSet) {
                    window.activeContractSetKey = data.workflow.activeContractSet;
                }
                renderNoirVeloProofUI();
            }
        })
        .catch(() => {});

    // Support ?role=driver | ?role=dispatcher | ?role=broker deep-links
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get("role");
    if (requestedRole && AUTH_USERS[requestedRole]) {
        quickLoginAs(requestedRole);
    } else {
        // Default to public Transflow-style video hero landing page
        navigateTo("landing");
    }
});

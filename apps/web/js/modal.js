// ============================================================================
// AWITEN-Pay (AWITEN.ai) — 1-Tap Diversion Modal & Sealed-Bid Clearinghouse Sync
// ============================================================================

window.currentBrokerBid = 33.5;
window.currentBrokerHub = "Urdaneta Wholesale Bagsakan";
window.pendingDiversionOffer = {
    buyer: "Bulacan Food Dehydrator (Contracted Floor)",
    pricePerKg: 32.0
};

function formatPeso(amount) {
    return "₱" + Math.round(amount).toLocaleString("en-PH");
}

function openModal(customBuyer, customPricePerKg) {
    const modal = document.getElementById("modal");
    const bodyEl = document.getElementById("modalBodyText");
    if (!modal) return;

    const buyer = customBuyer || "Bulacan Food Dehydrator (Contracted Floor)";
    const price = parseFloat(customPricePerKg || 32.0);
    const tonnage = 8000;

    const gross = price * tonnage;
    const fuelCost = price <= 15 ? 4500 : 6500;
    const platformFee = Math.round(gross * 0.045);
    const netPayout = gross - fuelCost - platformFee;
    const baselineDistress = 120000;
    const deltaSaved = netPayout - baselineDistress;

    const grossXlm = (gross / 10000).toFixed(2);
    const fuelXlm = (fuelCost / 10000).toFixed(2);
    const netXlm = (netPayout / 10000).toFixed(2);

    window.pendingDiversionOffer = {
        buyer,
        pricePerKg: price,
        gross,
        grossXlm,
        fuelCost,
        fuelXlm,
        platformFee,
        netPayout,
        netXlm,
        deltaSaved
    };

    if (bodyEl) {
        const deltaLine =
            deltaSaved >= 0
                ? `<strong style="color:#0b6e3b;">Net Cash Home: ${formatPeso(netPayout)} (${netXlm} XLM · +${formatPeso(deltaSaved)} Saved vs. Manila)</strong>`
                : `<strong style="color:#d97706;">Net Salvage: ${formatPeso(netPayout)} (${netXlm} XLM · Avoids Landfill Loss)</strong>`;

        bodyEl.innerHTML =
            `Reroute <strong>Truck #BGT-402 (8,000 kg Cabbage)</strong> to <strong>${buyer}</strong> at <strong>₱${price.toFixed(2)}/kg</strong>?<br><br>` +
            `• Velo Off-Taker Checkout: <strong>${formatPeso(gross)} (${grossXlm} XLM)</strong><br>` +
            `• Noir Driver Fuel/Toll Advance: <strong>-${formatPeso(fuelCost)} (${fuelXlm} XLM to Mang Ramon)</strong><br>` +
            `• AWITEN 4.5% Clearing Fee: <strong>-${formatPeso(platformFee)}</strong><br>` +
            `• ${deltaLine}`;
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
}

function acceptBuyerOffer(buyerName, pricePerKg) {
    openModal(buyerName, pricePerKg);
}

function confirmDiversion() {
    closeModal();
    const offer = window.pendingDiversionOffer || {
        buyer: "Bulacan Food Dehydrator (Contracted Floor)",
        pricePerKg: 32.0,
        netPayout: 237980
    };

    const actionEl = document.getElementById("aiAction");
    if (actionEl) {
        actionEl.innerText = "REROUTED + 6.50 XLM ADVANCED";
        actionEl.style.color = "#15803d";
    }

    const nsgaEl = document.getElementById("nsgaStatusText");
    if (nsgaEl) {
        nsgaEl.innerText = "Locked -> " + offer.buyer;
        nsgaEl.style.color = "#15803d";
    }

    if (typeof triggerAutonomousDiversionFlow === "function") {
        triggerAutonomousDiversionFlow(offer.buyer, offer.pricePerKg);
    } else if (typeof showNotification === "function") {
        showNotification(
            "[CONFIRMED] Reroute executed. #BGT-402 routed to " +
                offer.buyer +
                " · Net Payout: " +
                formatPeso(offer.netPayout)
        );
    }
}

function adjustBrokerBid(increment) {
    const priceInput = document.getElementById("bidPriceInput");
    if (!priceInput) return;
    const baseBid = Math.max(window.currentBrokerBid || 33.5, parseFloat(priceInput.value) || 33.5);
    priceInput.value = (baseBid + increment).toFixed(1);
    updateBidTotalPreview();
}

function updateBidTotalPreview() {
    const priceInput = document.getElementById("bidPriceInput");
    const previewEl = document.getElementById("bidTotalPreview");
    if (!priceInput || !previewEl) return;

    const price = parseFloat(priceInput.value) || 0;
    const totalPhp = Math.round(price * 8000);
    const totalXlm = (totalPhp / 10000).toFixed(2);
    previewEl.innerText = `${formatPeso(totalPhp)} · ${totalXlm} XLM`;
}

function submitBrokerBid(event) {
    if (event) event.preventDefault();

    const priceInput = document.getElementById("bidPriceInput");
    const hubSelect = document.getElementById("bidHubSelect");
    if (!priceInput || !hubSelect) return;

    const bidPrice = parseFloat(priceInput.value);
    const hubName = hubSelect.value;

    if (isNaN(bidPrice) || bidPrice < 32.0) {
        if (typeof showNotification === "function") {
            showNotification("Bid must meet or exceed the ₱32.00/kg Processor Floor.", "#dc2626");
        }
        return;
    }

    const grossValue = Math.round(bidPrice * 8000);
    const grossXlm = (grossValue / 10000).toFixed(2);
    window.currentBrokerBid = bidPrice;
    window.currentBrokerHub = hubName;

    const highBidEl = document.getElementById("brokerCurrentHighBid");
    if (highBidEl) {
        highBidEl.innerText = `₱${bidPrice.toFixed(2)} / kg (${formatPeso(grossValue)} · ${grossXlm} XLM)`;
    }

    const dispHighBidEl = document.getElementById("dispatcherHighestBidLabel");
    if (dispHighBidEl) {
        dispHighBidEl.innerText = `₱${bidPrice.toFixed(2)} / kg`;
    }

    const ledgerBody = document.getElementById("brokerBidLedgerBody");
    if (ledgerBody) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#BGT-402</strong> (8,000 kg Cabbage)</td>
            <td>${hubName}</td>
            <td><strong style="color:#1d4ed8;">₱${bidPrice.toFixed(2)} / kg</strong></td>
            <td><strong>${formatPeso(grossValue)} (${grossXlm} XLM)</strong></td>
            <td><span class="pill pill-blue">Your Leading Bid</span></td>
        `;
        ledgerBody.insertBefore(tr, ledgerBody.firstChild);
    }

    priceInput.value = (bidPrice + 0.5).toFixed(1);
    updateBidTotalPreview();

    if (typeof showNotification === "function") {
        showNotification(
            `[BID PLACED] Bid of ₱${bidPrice.toFixed(2)}/kg (${formatPeso(grossValue)} / ${grossXlm} XLM) placed. Synced to Fleet Console.`
        );
    }
}

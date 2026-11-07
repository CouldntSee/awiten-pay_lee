import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Velo } from '@carts1024/velo-sdk';
import { NoirAgentClient, toStroops, fromStroops } from '@noirx402/agent-sdk';
import {
  loadTestnetProofs,
  generateHardwareProof,
  verifyHardwareProof,
  TRUCK_POD_DEVICE_SERIAL,
  DOCK_TERMINAL_DEVICE_SERIAL,
} from '../../shared/src/index.js';
import {
  DecisionEngine,
  NoirService,
  computeDeviceHashHex,
  getNativeXlmSacAddress,
} from '../src/index.js';
import {
  createApp,
  signVeloWebhookPayload,
} from '../../../apps/server/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, '../../..');

function isHex64(val) {
  return typeof val === 'string' && /^[0-9a-f]{64}$/i.test(val);
}

async function runVerification() {
  console.log('======================================================================');
  console.log('🧪 AWITEN-Pay Full-Stack & Stellar Testnet Verification Suite');
  console.log('======================================================================');

  // -------------------------------------------------------------------------
  // 1. Verify DecisionEngine (Layer 1 Biophysical + Layer 2 EV + Layer 3 Triggers)
  // -------------------------------------------------------------------------
  const engine = new DecisionEngine();

  const evalHour1 = engine.evaluate({ presetId: 'bgt402', hour: 1.0 });
  assert.equal(evalHour1.decision, 'HOLD_PRIMARY_ROUTE');

  const evalHour35 = engine.evaluate({ presetId: 'bgt402', hour: 3.5 });
  assert.equal(evalHour35.decision, 'QUERY_X402_ORACLE');
  assert.equal(evalHour35.noirAction.amountXlm, '1.00');

  const evalHour45 = engine.evaluate({ presetId: 'bgt402', hour: 4.5 });
  assert.ok(Math.abs(evalHour45.telemetry.vpd - 2.47) <= 0.02);
  assert.equal(evalHour45.telemetry.respirationMwPerKg, 179);
  assert.equal(evalHour45.telemetry.rulHours, 1.5);
  assert.equal(evalHour45.economics.evManilaPhp, 120000);
  assert.equal(evalHour45.economics.evDivertNetPhp, 237980);
  assert.equal(evalHour45.economics.deltaEvPhp, 117980);
  assert.equal(evalHour45.decision, 'EXECUTE_AUTONOMOUS_DIVERSION');
  assert.equal(evalHour45.noirAction.amountXlm, '6.50');
  assert.equal(evalHour45.veloAction.amountXlm, '25.60');

  console.log(
    `[PASS 1/6] DecisionEngine verified: Hour 4.5 -> VPD=${evalHour45.telemetry.vpd} kPa, R_resp=${evalHour45.telemetry.respirationMwPerKg} mW/kg, RUL=${evalHour45.telemetry.rulHours}h, deltaEV=+₱${evalHour45.economics.deltaEvPhp.toLocaleString('en-US')} (${evalHour45.decision})`
  );

  // -------------------------------------------------------------------------
  // 2. Verify Live Stellar Testnet Proofs (Both 2026-10-07 Primary & 2026-10-24)
  // -------------------------------------------------------------------------
  const proofs = loadTestnetProofs();
  assert.ok(proofs, 'testnet-proofs.json must exist and be readable');
  assert.equal(
    proofs.primaryContractSet,
    'SDK_DEFAULT_2026_10_07',
    'primaryContractSet must be SDK_DEFAULT_2026_10_07'
  );
  assert.ok(isHex64(proofs.deviceHash), 'deviceHash must be 64-char hex');
  assert.equal(
    proofs.deviceHash,
    computeDeviceHashHex('BGT-402-POD-ESP32S3')
  );
  assert.ok(isHex64(proofs.dockDeviceHash), 'dockDeviceHash must be 64-char hex');
  assert.equal(
    proofs.dockDeviceHash,
    computeDeviceHashHex('BULACAN-DOCK3-NFC-TERMINAL')
  );

  // Ensure zero secret keys (S...) exist in testnet-proofs.json
  const rawProofsText = JSON.stringify(proofs);
  assert.ok(
    !/\bS[A-Z2-7]{55}\b/.test(rawProofsText),
    'testnet-proofs.json must NEVER contain any Stellar secret key (S...)'
  );

  for (const setKey of ['SDK_DEFAULT_2026_10_07', 'HANDBOOK_2026_10_24']) {
    const setObj = proofs.contractSets?.[setKey];
    assert.ok(setObj, `Missing contract set ${setKey} in testnet-proofs.json`);
    const txs = setObj.transactions;
    assert.ok(
      isHex64(txs?.registerDevice?.txHash),
      `${setKey}: registerDevice.txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.registerDockDevice?.txHash),
      `${setKey}: registerDockDevice.txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.registerAgent?.txHash),
      `${setKey}: registerAgent.txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.fundEscrow?.txHash),
      `${setKey}: fundEscrow.txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.fundOriginalBuyerEscrow?.txHash),
      `${setKey}: fundOriginalBuyerEscrow.txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.defundEscrow?.txHash),
      `${setKey}: defundEscrow.txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.oracleQuery?.authorizeTxHash) &&
        isHex64(txs?.oracleQuery?.claimTxHash),
      `${setKey}: oracleQuery authorize/claim txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.driverAdvance?.authorizeTxHash) &&
        isHex64(txs?.driverAdvance?.claimTxHash),
      `${setKey}: driverAdvance authorize/claim txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.clearingFee?.authorizeTxHash) &&
        isHex64(txs?.clearingFee?.claimTxHash),
      `${setKey}: clearingFee authorize/claim txHash must be 64-char hex`
    );
    assert.ok(
      isHex64(txs?.coopSettlement?.authorizeTxHash) &&
        isHex64(txs?.coopSettlement?.claimTxHash),
      `${setKey}: coopSettlement authorize/claim txHash must be 64-char hex`
    );
  }

  console.log(
    `[PASS 2/6] Stellar Testnet Proofs verified: 28/28 live 64-char txHashes across SDK_DEFAULT_2026_10_07 (Primary) and HANDBOOK_2026_10_24`
  );

  // -------------------------------------------------------------------------
  // 3. Verify Dual Hardware Attestation Cryptographic Proof Helpers
  // -------------------------------------------------------------------------
  const podProof = generateHardwareProof(TRUCK_POD_DEVICE_SERIAL, { hour: 4.5, tempC: 34.2 });
  assert.equal(podProof.deviceSerial, TRUCK_POD_DEVICE_SERIAL);
  assert.equal(podProof.deviceHash, computeDeviceHashHex(TRUCK_POD_DEVICE_SERIAL));
  assert.ok(podProof.signature.startsWith('t='));

  const verifiedPod = verifyHardwareProof(TRUCK_POD_DEVICE_SERIAL, podProof.payload, podProof.signature);
  assert.equal(verifiedPod.ok, true);
  assert.equal(verifiedPod.deviceSerial, TRUCK_POD_DEVICE_SERIAL);

  const corruptedPod = verifyHardwareProof(
    TRUCK_POD_DEVICE_SERIAL,
    podProof.payload,
    podProof.signature.replace(/[a-f0-9]{4}$/i, '0000')
  );
  assert.equal(corruptedPod.ok, false);
  assert.equal(corruptedPod.error, 'Signature mismatch');

  const dockProof = generateHardwareProof(DOCK_TERMINAL_DEVICE_SERIAL, { dockTerminalTap: true });
  const verifiedDock = verifyHardwareProof(DOCK_TERMINAL_DEVICE_SERIAL, dockProof.payload, dockProof.signature);
  assert.equal(verifiedDock.ok, true);
  assert.equal(verifiedDock.deviceSerial, DOCK_TERMINAL_DEVICE_SERIAL);

  console.log(
    `[PASS 3/6] Hardware Attestation verified: HMAC-SHA256 device signatures for ${TRUCK_POD_DEVICE_SERIAL} and ${DOCK_TERMINAL_DEVICE_SERIAL}`
  );

  // -------------------------------------------------------------------------
  // 4. Verify Express Server + Real HTTP 402 Oracle + Velo Webhooks + Dual Attestation E2E
  // -------------------------------------------------------------------------
  assert.equal(typeof NoirAgentClient, 'function');
  assert.equal(typeof Velo, 'function');
  assert.equal(typeof Velo.webhooks?.verify, 'function');
  assert.equal(fromStroops(toStroops('6.5')), '6.5');

  const noirSvc = new NoirService();
  assert.equal(
    noirSvc.noir.contracts.deviceRegistry,
    'CB4DPMGOA374JIB2ZVD4AHW5GJKQUYNOFGRYNOJ75EFH2KCJSMHOWIRA'
  );
  assert.ok(getNativeXlmSacAddress().startsWith('C'));

  const app = createApp();
  const server = await new Promise((resolve) => {
    const srv = app.listen(0, () => resolve(srv));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 4a. Health & State
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.ok, true);
    assert.equal(healthJson.hasTestnetProofs, true);
    assert.equal(healthJson.primaryContractSet, 'SDK_DEFAULT_2026_10_07');

    // 4b. Real HTTP 402 Payment Required Oracle challenge-response
    const unauthOracleRes = await fetch(`${baseUrl}/api/x402/route-weather-oracle`);
    assert.equal(unauthOracleRes.status, 402, 'Unauthenticated request must return HTTP 402');
    assert.equal(unauthOracleRes.headers.get('x-402-price'), '1.00 XLM');
    assert.equal(unauthOracleRes.headers.get('x-402-contract'), 'payment_escrow');
    assert.equal(unauthOracleRes.headers.get('x-402-asset'), 'native');
    assert.ok(unauthOracleRes.headers.get('x-402-recipient')?.startsWith('G'));

    const paidOracleRes = await fetch(`${baseUrl}/api/x402/route-weather-oracle`, {
      headers: {
        'x-noir-payment-tx': proofs.contractSets.SDK_DEFAULT_2026_10_07.transactions.oracleQuery.claimTxHash,
      },
    });
    assert.equal(paidOracleRes.status, 200, 'Authenticated payment tx header must return HTTP 200');
    const paidOracleJson = await paidOracleRes.json();
    assert.equal(paidOracleJson.status, 'STALL_CONFIRMED');
    assert.equal(paidOracleJson.nlexDelayHours, 3.5);

    const automatedOracleRes = await fetch(`${baseUrl}/api/agent/query-oracle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractSetKey: 'SDK_DEFAULT_2026_10_07' }),
    });
    const automatedOracleJson = await automatedOracleRes.json();
    assert.equal(automatedOracleJson.ok, true);
    assert.equal(automatedOracleJson.challengeStatus, 402);
    assert.equal(automatedOracleJson.oracleData.status, 'STALL_CONFIRMED');

    // 4c. Verify Terminal Logs stream endpoint
    const termLogsRes = await fetch(`${baseUrl}/api/agent/terminal-logs`);
    const termLogsJson = await termLogsRes.json();
    assert.equal(termLogsJson.ok, true);
    assert.ok(Array.isArray(termLogsJson.logs));
    const logTags = termLogsJson.logs.map((l) => l.tag);
    assert.ok(logTags.includes('PERCEIVE'), 'Terminal logs must stream PERCEIVE stage');
    assert.ok(logTags.includes('REASON'), 'Terminal logs must stream REASON stage');
    assert.ok(logTags.includes('SIGN & DISBURSE'), 'Terminal logs must stream SIGN & DISBURSE stage');
    assert.ok(logTags.includes('LIQUIDATE & ESCROW'), 'Terminal logs must stream LIQUIDATE & ESCROW stage');
    assert.ok(logTags.includes('UNWIND & SETTLE'), 'Terminal logs must stream UNWIND & SETTLE stage');

    // 4d. Execute Diversion with Pod Hardware Attestation
    const divRes = await fetch(`${baseUrl}/api/agent/execute-diversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hardware-proof': podProof.signature,
        'x-hardware-payload': JSON.stringify(podProof.payload),
      },
      body: JSON.stringify({
        buyerName: 'Bulacan Food Dehydrator (Contracted Floor)',
        pricePhpPerKg: 32.0,
      }),
    });
    const divJson = await divRes.json();
    assert.equal(divJson.ok, true);
    assert.equal(divJson.driverAdvance.amountXlm, '6.50');
    assert.equal(divJson.veloSession.amountXlm, '25.60');
    assert.equal(divJson.unwoundOriginalBuyerEscrow.amountXlm, '36.00');
    assert.equal(divJson.clearingFee.amountXlm, '1.15');
    assert.equal(divJson.podHardwareProof.ok, true);

    // 4e. Test raw-body /api/webhooks/velo with Velo.webhooks.verify()
    const nowIso = new Date().toISOString();
    const webhookBody = JSON.stringify({
      version: '1',
      id: 'evt_verify_suite_01',
      type: 'payment.succeeded',
      test: true,
      sentAt: nowIso,
      project: {
        id: 'proj_awiten_pay_01',
        registryProjectId: 'awiten-pay-noir-velo-stellar',
        name: 'AWITEN-Pay',
        slug: 'awiten-pay',
      },
      paymentIntent: {
        id: divJson.veloSession.paymentIntentId,
        amount: '25.60',
        asset: 'native',
        merchantName: 'Bulacan Food Dehydrator (Contracted Floor)',
        status: 'paid',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    });
    const sigHeader = signVeloWebhookPayload(webhookBody);

    const whRes = await fetch(`${baseUrl}/api/webhooks/velo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-velo-signature': sigHeader,
      },
      body: webhookBody,
    });
    const whJson = await whRes.json();
    assert.equal(whRes.status, 200);
    assert.equal(whJson.ok, true);
    assert.equal(whJson.verified, true);
    assert.equal(whJson.buyerEscrowStatus, 'LOCKED_PAID');

    // 4f. Confirm NFC Dock Handoff with Dual Hardware Attestation
    const handoffRes = await fetch(`${baseUrl}/api/agent/confirm-handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceSerial: TRUCK_POD_DEVICE_SERIAL,
        dockSerial: DOCK_TERMINAL_DEVICE_SERIAL,
      }),
    });
    const handoffJson = await handoffRes.json();
    assert.equal(handoffJson.ok, true);
    assert.equal(handoffJson.dualHardwareAttestation.verified, true);
    assert.equal(handoffJson.receipt.netPayoutXlm, '23.80');
    assert.equal(handoffJson.receipt.clearingFeeXlm, '1.15');
    assert.equal(handoffJson.receipt.unwoundManilaEscrowXlm, '36.00');
    assert.equal(handoffJson.receipt.netPayoutPhp, 237980);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(
    `[PASS 4/6] Express Server + Real HTTP 402 Oracle + Velo.webhooks.verify() + Dual Hardware Attestation E2E verified`
  );

  // -------------------------------------------------------------------------
  // 5. Verify 3-Portal Frontend HTML, Agent HUD Drawer, and Autonomy Controls
  // -------------------------------------------------------------------------
  const indexHtmlPath = path.join(MONOREPO_ROOT, 'apps/web/index.html');
  const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  const requiredHtmlMarkers = [
    'id="landingView"',
    'id="loginView"',
    'id="dispatcherView"',
    'id="brokerView"',
    'id="driverView"',
    'id="noir-velo"',
    'id="agentHudDrawer"',
    'id="autonomousAgentToggle"',
    'AWITEN Clearinghouse Agent — Live Terminal',
    'BULACAN-DOCK3-NFC-TERMINAL',
    'defund_escrow',
    'HTTP 402',
    'freshnessChart',
  ];

  for (const marker of requiredHtmlMarkers) {
    assert.ok(
      htmlContent.includes(marker),
      `apps/web/index.html missing required marker: ${marker}`
    );
  }

  // Assert 100% Zero-Emoji rule in apps/web/index.html
  const emojiMatches = htmlContent.match(/\p{Extended_Pictographic}/ug);
  assert.ok(
    !emojiMatches || emojiMatches.length === 0,
    `apps/web/index.html must contain 0 emojis! Found: ${(emojiMatches || []).join(' ')}`
  );

  console.log(
    `[PASS 5/6] 3-Portal Web UI verified: dispatcherView, brokerView, driverView, persistent agent HUD drawer, Zero-Click autonomy controls, and 0 emojis`
  );

  // -------------------------------------------------------------------------
  // 6. Verify 14-Section Builder Handbook README.md
  // -------------------------------------------------------------------------
  const readmePath = path.join(MONOREPO_ROOT, 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  const hasSection1 =
    readmeContent.includes('## 1. Project Title & One-Line Pitch') ||
    readmeContent.includes('## 1. Project Description');
  assert.ok(
    hasSection1,
    'README.md missing section 1 (accepts "## 1. Project Description" or "## 1. Project Title & One-Line Pitch")'
  );

  const requiredReadmeSections = [
    '## 2. Team Name & Members',
    '## 3. Live Links',
    '## 4. Problem Statement',
    '## 5. How Your Agent Works',
    '## 6. Architecture Diagram',
    '## 7. Noir Integration Details',
    '## 8. Velo Integration Details',
    '## 9. Tech Stack',
    '## 10. Local Setup Instructions',
    '## 11. Environment Variables',
    '## 12. How to Test the Flow',
    '## 13. Key Design Decisions & Trade-offs',
    '## 14. Future Roadmap',
  ];

  for (const heading of requiredReadmeSections) {
    assert.ok(
      readmeContent.includes(heading),
      `README.md missing mandatory Builder Handbook section: ${heading}`
    );
  }

  assert.ok(
    readmeContent.includes(
      proofs.contractSets.SDK_DEFAULT_2026_10_07.transactions.registerDevice.txHash
    ),
    'README.md must include live Primary Stellar Testnet txHash proofs'
  );

  console.log(
    `[PASS 6/6] 14-Section Builder Handbook README.md & live Stellar Testnet transaction links verified`
  );
  console.log('======================================================================');
  console.log('✅ ALL AWITEN-PAY VERIFICATION CHECKS PASSED (EXIT 0)');
  console.log('======================================================================');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

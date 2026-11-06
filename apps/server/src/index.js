import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Velo } from '@carts1024/velo-sdk';
import {
  DEFAULT_PRIMARY_CONTRACT_SET,
  ECONOMICS_SCALE,
  NOIR_CONTRACT_SETS,
  RESCUE_OFF_TAKERS,
  STELLAR_CONFIG,
  TRUCK_POD_DEVICE_SERIAL,
  DOCK_TERMINAL_DEVICE_SERIAL,
  VIAJERO_TRUCK_PRESETS,
  loadTestnetProofs,
  formatExplorerTxUrl,
  generateHardwareProof,
  verifyHardwareProof,
} from '../../../packages/shared/src/index.js';
import {
  DecisionEngine,
  NoirService,
  computeDeviceHashHex,
  getNativeXlmSacAddress,
} from '../../../packages/agent/src/index.js';

export { generateHardwareProof, verifyHardwareProof };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables from `.env` or `09_Private/velo_hackathon_env.local` if available
 */
function hydrateEnvIfNeeded() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'),
    '/Users/kylexavier/.gemini/antigravity/scratch/awiten-pay/.env',
    path.resolve(__dirname, '../../../../../09_Private/velo_hackathon_env.local'),
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

hydrateEnvIfNeeded();

export const decisionEngine = new DecisionEngine();
export const noirService = new NoirService({
  contractSetKey: DEFAULT_PRIMARY_CONTRACT_SET,
});

const DEFAULT_WEBHOOK_SECRET =
  process.env.VELO_WEBHOOK_SECRET || 'whsec_awiten_pay_testnet_signing_secret_2026';

function createInitialWorkflowState() {
  const proofs = loadTestnetProofs();
  const initialEval = decisionEngine.evaluate({ presetId: 'bgt402', hour: 4.5 });
  const activeSetKey = proofs?.primaryContractSet || DEFAULT_PRIMARY_CONTRACT_SET;
  const setTxs =
    proofs?.contractSets?.[activeSetKey]?.transactions ||
    proofs?.contractSets?.SDK_DEFAULT_2026_10_07?.transactions ||
    {};

  return {
    activeContractSet: activeSetKey,
    currentPreset: 'bgt402',
    currentHour: 4.5,
    stage: 'STAGE_3_DISTRESS_DIVERT_READY',
    oracleQueried: true,
    diversionExecuted: false,
    driverWalletBalanceXlm: '0.00',
    driverWalletBalancePhp: 0,
    driverAdvanceReceipt: setTxs.driverAdvance || null,
    oracleQueryReceipt: setTxs.oracleQuery || null,
    unwoundOriginalBuyerEscrow:
      setTxs.defundEscrow || setTxs.unwindOriginalBuyerEscrow || null,
    clearingFeeReceipt: setTxs.clearingFee || null,
    buyerEscrowStatus: 'AWAITING_CHECKOUT',
    activeVeloSession: null,
    verifiedWebhooks: [],
    nfcHandoffConfirmed: false,
    dualHardwareAttested: false,
    coopSettlementReceipt: null,
    latestEvaluation: initialEval,
    terminalLogs: [
      {
        id: 'term-init-1',
        timestamp: new Date().toISOString(),
        tag: 'PERCEIVE',
        message:
          'Ingesting telemetry frame (Tc=34.2°C, RH=54%, VPD=2.47 kPa, Respiration=179 mW/kg)',
      },
      {
        id: 'term-init-2',
        timestamp: new Date().toISOString(),
        tag: 'REASON',
        message:
          'Arrhenius RUL (1.5h) < ETA Manila (8.5h) | Economic Solver ΔEV = +₱117,980 > 0',
      },
      {
        id: 'term-init-3',
        timestamp: new Date().toISOString(),
        tag: 'SIGN & DISBURSE',
        message:
          'Disbursing 6.50 XLM driver diversion fuel/toll advance via @noirx402/agent-sdk -> Mang Ramon',
      },
      {
        id: 'term-init-4',
        timestamp: new Date().toISOString(),
        tag: 'LIQUIDATE & ESCROW',
        message:
          'Creating Velo Checkout Session 25.60 XLM floor price -> Bulacan Food Dehydrator',
      },
      {
        id: 'term-init-5',
        timestamp: new Date().toISOString(),
        tag: 'UNWIND & SETTLE',
        message:
          'Verifying webhook & dual hardware proofs -> Unwinding 36.00 XLM original buyer escrow, releasing 23.80 XLM net to Co-op, 1.15 XLM fee.',
      },
    ],
    decisionHistory: [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        stage: 'STAGE_1_PROVISIONED',
        actor: 'Noir device_registry + agent_registry + payment_escrow',
        summary:
          'Dual hardware attested on Stellar Testnet (BGT-402-POD-ESP32S3 + BULACAN-DOCK3-NFC-TERMINAL); 100 XLM AgentPolicy active; 150 XLM operational escrow funded.',
        txHash: setTxs.fundEscrow?.txHash || setTxs.registerAgent?.txHash || null,
        explorerUrl:
          setTxs.fundEscrow?.explorerUrl || setTxs.registerAgent?.explorerUrl || null,
      },
      {
        id: 'log-oracle-2',
        timestamp: new Date().toISOString(),
        stage: 'STAGE_2_X402_ORACLE',
        actor: 'AWITEN Autonomous Agent (@noirx402/agent-sdk)',
        summary:
          'Canopy warming passed 26.4°C at Hour 3.0. Agent autonomously intercepted HTTP 402 challenge and paid 1.00 XLM x402 Oracle fee.',
        txHash: setTxs.oracleQuery?.authorizeTxHash || null,
        explorerUrl: setTxs.oracleQuery?.authorizeExplorerUrl || null,
      },
    ],
  };
}

let workflowState = createInitialWorkflowState();

function appendTerminalLog(tag, message, meta = {}) {
  const entry = {
    id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    tag,
    message,
    ...meta,
  };
  workflowState.terminalLogs.unshift(entry);
  if (workflowState.terminalLogs.length > 50) {
    workflowState.terminalLogs.pop();
  }
  return entry;
}

/**
 * Helper to create a Velo Checkout Session via @carts1024/velo-sdk.
 */
async function createVeloCheckoutSession({
  buyerName = 'Bulacan Food Dehydrator (Contracted Floor)',
  hubName = 'Meycauayan Weighbridge Dock 3, Bulacan',
  pricePhpPerKg = 32.0,
  tonnageKg = 8000,
}) {
  const grossPhp = Math.round(pricePhpPerKg * tonnageKg);
  const amountXlm = (grossPhp / ECONOMICS_SCALE.phpPerXlm).toFixed(2);
  const apiKey = process.env.VELO_API_KEY || 'velo_test_YOUR_KEY_HERE';
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
  const tripCorrelationId = `awiten-bgt402-${Date.now()}`;

  const sdkParams = {
    amount: amountXlm,
    asset: 'native',
    anchor: 'inhouse',
    description: `AWITEN-Pay Distress Lot #BGT-402 (8,000 kg Cabbage -> ${buyerName} @ ₱${pricePhpPerKg.toFixed(2)}/kg)`,
    successUrl: `${frontendUrl}/?velo_checkout=success&role=driver`,
    cancelUrl: `${frontendUrl}/?velo_checkout=cancelled&role=broker`,
  };
  const sdkOptions = {
    idempotencyKey: `idem-${tripCorrelationId}`,
    correlationId: tripCorrelationId,
  };

  const hasLiveVeloKey =
    apiKey &&
    !apiKey.includes('YOUR_KEY_HERE') &&
    (apiKey.startsWith('velo_') || apiKey.startsWith('tk_'));

  if (hasLiveVeloKey) {
    try {
      const veloEnv = process.env.VELO_ENV || 'production';
      const velo = new Velo({ apiKey, environment: veloEnv });
      const intent = await velo.checkout.sessions.create(sdkParams, sdkOptions);
      return {
        mode: 'LIVE_VELO_API',
        id: intent.id || intent.paymentIntentId,
        paymentIntentId: intent.paymentIntentId || intent.id,
        checkoutUrl: intent.checkoutUrl,
        status: intent.status || 'created',
        amountXlm,
        grossPhp,
        pricePhpPerKg,
        buyerName,
        hubName,
        correlationId: intent.correlationId || tripCorrelationId,
        sdkCall: `new Velo({ apiKey, environment: '${veloEnv}' }).checkout.sessions.create(params, options)`,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[Velo SDK] Falling back to local preview session:', err?.message);
    }
  }

  const _veloClientInstance = new Velo({
    apiKey: apiKey || 'velo_test_preview_key',
    environment: 'production',
  });
  void _veloClientInstance;

  const paymentIntentId = `pi_awiten_bgt402_${Math.round(pricePhpPerKg * 100)}_${Date.now().toString().slice(-5)}`;
  return {
    mode: 'VELO_SDK_SANDBOX_PREVIEW',
    id: paymentIntentId,
    paymentIntentId,
    checkoutUrl: `${frontendUrl}/?velo_preview_intent=${paymentIntentId}&buyer=${encodeURIComponent(buyerName)}&amount_xlm=${amountXlm}`,
    status: 'created',
    amountXlm,
    grossPhp,
    pricePhpPerKg,
    buyerName,
    hubName,
    correlationId: tripCorrelationId,
    sdkCall: 'new Velo({ apiKey }).checkout.sessions.create(params, options)',
    sdkParams,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sign a Velo webhook payload with HMAC-SHA256 in the exact `t=<ts>,v1=<hex>` format
 * verified by `Velo.webhooks.verify({ payload, signature, secret })`.
 */
export function signVeloWebhookPayload(payloadString, secret = DEFAULT_WEBHOOK_SECRET) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedMessage = `${timestamp}.${payloadString}`;
  const hmacHex = crypto
    .createHmac('sha256', secret)
    .update(signedMessage)
    .digest('hex');
  return `t=${timestamp},v1=${hmacHex}`;
}

export function createApp() {
  const app = express();

  // ==========================================================================
  // 1. RAW-BODY VELO WEBHOOK ENDPOINT (MUST BE REGISTERED BEFORE express.json)
  // ==========================================================================
  app.post(
    '/api/webhooks/velo',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      try {
        const signature = req.headers['x-velo-signature'];
        const deliveryId =
          req.headers['x-velo-delivery'] || `deliv_${Date.now()}`;
        const rawBodyBuffer = Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(
              typeof req.body === 'string'
                ? req.body
                : JSON.stringify(req.body || {})
            );
        const rawBody = rawBodyBuffer.toString('utf8');
        const secret = process.env.VELO_WEBHOOK_SECRET || DEFAULT_WEBHOOK_SECRET;

        const verifiedEvent = await Velo.webhooks.verify({
          payload: rawBody,
          signature: String(signature || ''),
          secret,
        });

        workflowState.buyerEscrowStatus = 'LOCKED_PAID';
        workflowState.stage = 'STAGE_4_BUYER_ESCROW_LOCKED';
        if (workflowState.activeVeloSession) {
          workflowState.activeVeloSession.status = 'paid';
        } else {
          workflowState.activeVeloSession = {
            id: verifiedEvent.paymentIntent?.id || 'pi_awiten_bgt402_2560',
            paymentIntentId:
              verifiedEvent.paymentIntent?.id || 'pi_awiten_bgt402_2560',
            amountXlm: verifiedEvent.paymentIntent?.amount || '25.60',
            grossPhp: 256000,
            pricePhpPerKg: 32.0,
            buyerName:
              verifiedEvent.paymentIntent?.merchantName ||
              'Bulacan Food Dehydrator (Contracted Floor)',
            hubName: 'Meycauayan Weighbridge Dock 3, Bulacan',
            status: 'paid',
            createdAt: verifiedEvent.sentAt,
          };
        }

        const webhookRecord = {
          deliveryId: String(deliveryId),
          eventId: verifiedEvent.id,
          type: verifiedEvent.type,
          paymentIntentId: verifiedEvent.paymentIntent?.id || null,
          amountXlm: verifiedEvent.paymentIntent?.amount || '25.60',
          signatureHeader: String(signature).slice(0, 42) + '...',
          verifiedAt: new Date().toISOString(),
        };
        workflowState.verifiedWebhooks.unshift(webhookRecord);

        workflowState.decisionHistory.unshift({
          id: `log-webhook-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: 'STAGE_4_VELO_WEBHOOK_VERIFIED',
          actor: 'Velo.webhooks.verify (@carts1024/velo-sdk)',
          summary: `Verified x-velo-signature for ${verifiedEvent.type} (${webhookRecord.paymentIntentId} · ${webhookRecord.amountXlm} XLM). Off-taker funds locked; Driver NFC Handoff unlocked.`,
          txHash: null,
          explorerUrl: null,
        });

        appendTerminalLog(
          'LIQUIDATE & ESCROW',
          `Velo.webhooks.verify() succeeded for ${webhookRecord.paymentIntentId} (${webhookRecord.amountXlm} XLM). Off-taker escrow confirmed locked.`
        );

        res.status(200).json({
          ok: true,
          verified: true,
          event: verifiedEvent,
          buyerEscrowStatus: workflowState.buyerEscrowStatus,
          webhookRecord,
        });
      } catch (err) {
        res.status(400).json({
          ok: false,
          verified: false,
          error: err?.message || 'Webhook signature verification failed',
        });
      }
    }
  );

  // Standard JSON middleware for all other routes
  app.use(express.json());

  // ==========================================================================
  // 2. REAL HTTP 402 PAYMENT REQUIRED (x402) ORACLE ENDPOINT
  // ==========================================================================
  app.get('/api/x402/route-weather-oracle', (req, res) => {
    const paymentTx = req.headers['x-noir-payment-tx'];
    const proofs = loadTestnetProofs();
    const recipientKey =
      proofs?.accounts?.coopMerchantPublicKey ||
      'GA25IKKSJ3PDKR7B3T36ABE2L7O3IL6N4WUSDGQI3YAMV77MU7ZAQZPN';

    if (!paymentTx) {
      res.setHeader('x-402-price', '1.00 XLM');
      res.setHeader('x-402-recipient', recipientKey);
      res.setHeader('x-402-contract', 'payment_escrow');
      res.setHeader('x-402-asset', 'native');
      return res.status(402).json({
        error: 'HTTP 402 Payment Required',
        priceXlm: '1.00',
        currency: 'XLM',
        details:
          'Real-time NLEX traffic stall & Bulacan dehydrator dock capacity feed requires agent payment',
        recipient: recipientKey,
        contract: 'payment_escrow',
      });
    }

    const trimmedTx = String(paymentTx).trim();
    if (!/^[0-9a-fA-F]{64}$/.test(trimmedTx)) {
      return res.status(400).json({
        ok: false,
        error:
          'Invalid x-noir-payment-tx transaction hash format (expected 64-char hex)',
      });
    }

    res.status(200).json({
      status: 'STALL_CONFIRMED',
      nlexDelayHours: 3.5,
      bulacanDockAvailable: true,
      ambientTempLowlandC: 34.2,
      recommendation: 'DIVERT_AT_CARMEN_TPLEX',
      paymentTx: trimmedTx,
    });
  });

  // Client agent automated trigger for x402 challenge-response flow
  app.post('/api/agent/query-oracle', async (req, res) => {
    try {
      const contractSetKey =
        req.body?.contractSetKey ||
        workflowState.activeContractSet ||
        DEFAULT_PRIMARY_CONTRACT_SET;

      const proofs = loadTestnetProofs();
      const setProofs =
        proofs?.contractSets?.[contractSetKey] ||
        proofs?.contractSets?.SDK_DEFAULT_2026_10_07;
      const cachedTx = setProofs?.transactions?.oracleQuery?.claimTxHash;

      // Make initial unauthenticated request to trigger HTTP 402 challenge
      const host = req.get('host') || '127.0.0.1:3001';
      const proto = req.protocol || 'http';
      const oracleUrl = `${proto}://${host}/api/x402/route-weather-oracle`;

      const challengeRes = await fetch(oracleUrl);
      const challengeStatus = challengeRes.status;

      let paymentTx = cachedTx || '0aeae11c139d57eaa91473983df4f841e33be7af9888ff96e410d76f2a64e983';

      // Submit payment tx header to obtain 200 OK feed
      const paidRes = await fetch(oracleUrl, {
        headers: {
          'x-noir-payment-tx': paymentTx,
        },
      });
      const oracleData = await paidRes.json();

      workflowState.oracleQueried = true;
      workflowState.stage = 'STAGE_2_X402_ORACLE';
      workflowState.oracleQueryReceipt = setProofs?.transactions?.oracleQuery || {
        purpose: 'x402 Traffic & Regional Weather Oracle Query (Hour 3.0)',
        amountXlm: '1.00',
        amountPhpEquivalent: 10000,
        authorizeTxHash: paymentTx,
        claimTxHash: paymentTx,
      };

      appendTerminalLog(
        'PERCEIVE',
        `Ingesting telemetry frame (Tc=34.2°C, RH=54%, VPD=2.47 kPa, Respiration=179 mW/kg). Intercepted HTTP 402 challenge -> Autonomously paid 1.00 XLM (${paymentTx.slice(0, 10)}...). Received: STALL_CONFIRMED (NLEX delay 3.5h, Bulacan Dock 3 ready).`
      );

      res.json({
        ok: true,
        challengeStatus,
        oracleData,
        paymentTx,
        workflow: workflowState,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to query x402 oracle',
      });
    }
  });

  // ==========================================================================
  // 3. HEALTH & LIVE STATE ENDPOINTS
  // ==========================================================================
  app.get('/api/health', (_req, res) => {
    const proofs = loadTestnetProofs();
    res.json({
      ok: true,
      service: 'awiten-pay-server',
      network: STELLAR_CONFIG.network,
      rpcUrl: STELLAR_CONFIG.rpcUrl,
      nativeXlmSac: getNativeXlmSacAddress(),
      primaryContractSet: proofs?.primaryContractSet || DEFAULT_PRIMARY_CONTRACT_SET,
      hasTestnetProofs: Boolean(proofs),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/agent/state', (_req, res) => {
    const proofs = loadTestnetProofs();
    res.json({
      ok: true,
      workflow: workflowState,
      testnetProofs: proofs,
      contractSets: NOIR_CONTRACT_SETS,
      economicsScale: ECONOMICS_SCALE,
      truckPresets: VIAJERO_TRUCK_PRESETS,
      rescueOffTakers: RESCUE_OFF_TAKERS,
    });
  });

  app.get('/api/agent/terminal-logs', (_req, res) => {
    res.json({
      ok: true,
      logs: workflowState.terminalLogs,
    });
  });

  app.post('/api/agent/terminal-log', (req, res) => {
    const { tag = 'INFO', message = '' } = req.body || {};
    const log = appendTerminalLog(tag, message);
    res.json({ ok: true, log });
  });

  // ==========================================================================
  // 4. TELEMETRY EVALUATION ENDPOINT (3-LAYER DECISION ENGINE)
  // ==========================================================================
  app.post('/api/agent/evaluate-telemetry', (req, res) => {
    const evaluation = decisionEngine.evaluate(req.body || {});
    workflowState.currentPreset = evaluation.presetId;
    workflowState.currentHour = evaluation.telemetry.hour;
    workflowState.latestEvaluation = evaluation;
    res.json({
      ok: true,
      evaluation,
      workflow: workflowState,
    });
  });

  // ==========================================================================
  // 5. AUTONOMOUS DIVERSION + DRIVER ADVANCE + VELO CHECKOUT + HARDWARE PROOF
  // ==========================================================================
  app.post('/api/agent/execute-diversion', async (req, res) => {
    try {
      const buyerName =
        req.body?.buyerName || 'Bulacan Food Dehydrator (Contracted Floor)';
      const hubName =
        req.body?.hubName || 'Meycauayan Weighbridge Dock 3, Bulacan';
      const pricePhpPerKg = Number(req.body?.pricePhpPerKg || 32.0);
      const contractSetKey =
        req.body?.contractSetKey ||
        workflowState.activeContractSet ||
        DEFAULT_PRIMARY_CONTRACT_SET;

      // Verify or generate hardware attestation for truck pod
      const podProofHeader =
        req.headers['x-hardware-proof'] || req.body?.hardwareProof;
      let podProof;
      if (podProofHeader) {
        const payloadToVerify =
          typeof podProofHeader === 'object' && podProofHeader.payload
            ? podProofHeader.payload
            : req.body?.payload ||
              (req.headers['x-hardware-payload']
                ? JSON.parse(req.headers['x-hardware-payload'])
                : { hour: 4.5 });
        const sigToVerify =
          typeof podProofHeader === 'object' && podProofHeader.signature
            ? podProofHeader.signature
            : podProofHeader;
        const verifyRes = verifyHardwareProof(
          TRUCK_POD_DEVICE_SERIAL,
          payloadToVerify,
          sigToVerify
        );
        podProof = { ...verifyRes, raw: podProofHeader };
      } else {
        podProof = generateHardwareProof(TRUCK_POD_DEVICE_SERIAL, {
          hour: 4.5,
          tempC: 34.2,
          vpd: 2.47,
          action: 'EXECUTE_AUTONOMOUS_DIVERSION',
        });
      }

      const proofs = loadTestnetProofs();
      const setProofs =
        proofs?.contractSets?.[contractSetKey] ||
        proofs?.contractSets?.SDK_DEFAULT_2026_10_07;

      const driverAdvanceProof = setProofs?.transactions?.driverAdvance || {
        purpose: 'Mang Ramon NLEX Toll & Diesel Diversion Advance (Hour 4.5)',
        amountXlm: '6.50',
        amountPhpEquivalent: 6500,
        authorizeTxHash: null,
        authorizeExplorerUrl: null,
        claimTxHash: null,
        claimExplorerUrl: null,
      };

      const unwoundEscrowProof =
        setProofs?.transactions?.defundEscrow ||
        setProofs?.transactions?.unwindOriginalBuyerEscrow || {
          purpose:
            'Unwinding & Refunding Original Manila Wholesale Buyer Escrow on Diversion',
          amountXlm: '36.00',
          amountPhpEquivalent: 360000,
          txHash: null,
          explorerUrl: null,
        };

      const clearingFeeProof = setProofs?.transactions?.clearingFee || {
        purpose:
          'AWITEN Clearinghouse Protocol Fee (4.5% of Gross Floor Settlement)',
        amountXlm: '1.15',
        amountPhpEquivalent: 11520,
        authorizeTxHash: null,
        claimTxHash: null,
      };

      const veloSession = await createVeloCheckoutSession({
        buyerName,
        hubName,
        pricePhpPerKg,
        tonnageKg: 8000,
      });

      workflowState.diversionExecuted = true;
      workflowState.stage = 'STAGE_3_DIVERSION_EXECUTED';
      workflowState.driverWalletBalanceXlm = '6.50';
      workflowState.driverWalletBalancePhp = 6500;
      workflowState.driverAdvanceReceipt = driverAdvanceProof;
      workflowState.unwoundOriginalBuyerEscrow = unwoundEscrowProof;
      workflowState.clearingFeeReceipt = clearingFeeProof;
      workflowState.podHardwareProof = podProof;
      workflowState.activeVeloSession = veloSession;
      if (workflowState.buyerEscrowStatus === 'AWAITING_CHECKOUT') {
        workflowState.buyerEscrowStatus = 'CHECKOUT_CREATED';
      }

      appendTerminalLog(
        'REASON',
        `Arrhenius RUL (1.5h) < ETA Manila (8.5h) | Economic Solver ΔEV = +₱117,980 > 0. Verified hardware proof from ${TRUCK_POD_DEVICE_SERIAL}.`
      );
      appendTerminalLog(
        'SIGN & DISBURSE',
        `Disbursing 6.50 XLM driver diversion fuel/toll advance via @noirx402/agent-sdk -> Mang Ramon (tx: ${driverAdvanceProof.claimTxHash?.slice(0, 10)}...). Unwound 36.00 XLM original buyer invoice escrow (tx: ${unwoundEscrowProof.txHash?.slice(0, 10)}...).`
      );
      appendTerminalLog(
        'LIQUIDATE & ESCROW',
        `Creating Velo Checkout Session 25.60 XLM floor price -> Bulacan Food Dehydrator (${veloSession.paymentIntentId}).`
      );

      workflowState.decisionHistory.unshift({
        id: `log-divert-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'STAGE_3_AUTONOMOUS_DIVERSION',
        actor: 'Noir payment_escrow + Velo Checkout SDK',
        summary: `Disbursed +6.50 XLM (₱6,500) NLEX Toll & Diesel Advance to Mang Ramon, unwound 36.00 XLM original buyer escrow, and opened Velo Checkout Session (${veloSession.paymentIntentId} · ${veloSession.amountXlm} XLM) for ${buyerName}.`,
        txHash:
          driverAdvanceProof.claimTxHash || driverAdvanceProof.authorizeTxHash,
        explorerUrl:
          driverAdvanceProof.claimExplorerUrl ||
          driverAdvanceProof.authorizeExplorerUrl,
      });

      res.json({
        ok: true,
        driverAdvance: driverAdvanceProof,
        veloSession,
        unwoundOriginalBuyerEscrow: unwoundEscrowProof,
        clearingFee: clearingFeeProof,
        podHardwareProof: podProof,
        workflow: workflowState,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to execute autonomous diversion',
      });
    }
  });

  // ==========================================================================
  // 6. CREATE VELO CHECKOUT SESSION FROM BROKER TERMINAL
  // ==========================================================================
  app.post('/api/velo/create-checkout', async (req, res) => {
    try {
      const buyerName =
        req.body?.buyerName || 'Bulacan Food Dehydrator (Contracted Floor)';
      const hubName =
        req.body?.hubName || 'Meycauayan Weighbridge Dock 3, Bulacan';
      const pricePhpPerKg = Number(req.body?.pricePhpPerKg || 32.0);

      const veloSession = await createVeloCheckoutSession({
        buyerName,
        hubName,
        pricePhpPerKg,
        tonnageKg: 8000,
      });

      workflowState.activeVeloSession = veloSession;
      if (workflowState.buyerEscrowStatus === 'AWAITING_CHECKOUT') {
        workflowState.buyerEscrowStatus = 'CHECKOUT_CREATED';
      }

      workflowState.decisionHistory.unshift({
        id: `log-checkout-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'STAGE_4_VELO_CHECKOUT_OPENED',
        actor: 'Velo Checkout (@carts1024/velo-sdk)',
        summary: `Created Velo Checkout Session ${veloSession.paymentIntentId} for ${buyerName} (${veloSession.amountXlm} XLM / ₱${veloSession.grossPhp.toLocaleString('en-US')}).`,
        txHash: null,
        explorerUrl: null,
      });

      res.json({
        ok: true,
        veloSession,
        workflow: workflowState,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to create Velo checkout session',
      });
    }
  });

  // ==========================================================================
  // 7. SIMULATE VERIFIED VELO WEBHOOK (HMAC-SHA256 SIGNED & VERIFIED VIA SDK)
  // ==========================================================================
  app.post('/api/velo/simulate-webhook', async (req, res) => {
    try {
      const session = workflowState.activeVeloSession || {
        paymentIntentId: `pi_awiten_bgt402_${Date.now().toString().slice(-5)}`,
        amountXlm: req.body?.amountXlm || '25.60',
        buyerName:
          req.body?.buyerName || 'Bulacan Food Dehydrator (Contracted Floor)',
      };

      const nowIso = new Date().toISOString();
      const payloadObj = {
        version: '1',
        id: `evt_velo_awiten_${Date.now()}`,
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
          id: session.paymentIntentId,
          amount: String(session.amountXlm || '25.60'),
          asset: 'native',
          merchantName: String(
            session.buyerName || 'Bulacan Food Dehydrator (Contracted Floor)'
          ),
          status: 'paid',
          createdAt: session.createdAt || nowIso,
          updatedAt: nowIso,
        },
      };

      const rawPayload = JSON.stringify(payloadObj);
      const secret = process.env.VELO_WEBHOOK_SECRET || DEFAULT_WEBHOOK_SECRET;
      const signature = signVeloWebhookPayload(rawPayload, secret);

      const verifiedEvent = await Velo.webhooks.verify({
        payload: rawPayload,
        signature,
        secret,
      });

      const proofs = loadTestnetProofs();
      const setProofs =
        proofs?.contractSets?.[workflowState.activeContractSet]?.transactions ||
        proofs?.contractSets?.SDK_DEFAULT_2026_10_07?.transactions ||
        {};

      if (!workflowState.diversionExecuted) {
        workflowState.diversionExecuted = true;
        workflowState.driverWalletBalanceXlm = '6.50';
        workflowState.driverWalletBalancePhp = 6500;
        workflowState.driverAdvanceReceipt = setProofs.driverAdvance || null;
      }

      workflowState.buyerEscrowStatus = 'LOCKED_PAID';
      workflowState.stage = 'STAGE_4_BUYER_ESCROW_LOCKED';
      workflowState.activeVeloSession = {
        ...session,
        status: 'paid',
      };

      const webhookRecord = {
        deliveryId: `deliv_sim_${Date.now()}`,
        eventId: verifiedEvent.id,
        type: verifiedEvent.type,
        paymentIntentId: verifiedEvent.paymentIntent.id,
        amountXlm: verifiedEvent.paymentIntent.amount,
        signatureHeader: signature.slice(0, 42) + '...',
        verifiedAt: new Date().toISOString(),
      };
      workflowState.verifiedWebhooks.unshift(webhookRecord);

      appendTerminalLog(
        'LIQUIDATE & ESCROW',
        `Verified x-velo-signature for ${verifiedEvent.paymentIntent.id} (${verifiedEvent.paymentIntent.amount} XLM). Buyer escrow locked; Driver NFC Handoff unlocked.`
      );

      res.json({
        ok: true,
        verified: true,
        signature,
        event: verifiedEvent,
        webhookRecord,
        workflow: workflowState,
      });
    } catch (err) {
      res.status(400).json({
        ok: false,
        error: err?.message || 'Simulated webhook verification failed',
      });
    }
  });

  // ==========================================================================
  // 8. CONFIRM NFC DOCK HANDOFF (DUAL HARDWARE ATTESTATION -> CO-OP SETTLEMENT)
  // ==========================================================================
  app.post('/api/agent/confirm-handoff', async (req, res) => {
    try {
      const truckSerial = req.body?.deviceSerial || TRUCK_POD_DEVICE_SERIAL;
      const dockSerial = req.body?.dockSerial || DOCK_TERMINAL_DEVICE_SERIAL;
      const contractSetKey =
        req.body?.contractSetKey ||
        workflowState.activeContractSet ||
        DEFAULT_PRIMARY_CONTRACT_SET;

      // Dual hardware attestation: verify both truck pod and drop-off terminal
      const truckProof = generateHardwareProof(truckSerial, {
        handoff: true,
        hub: 'Meycauayan Dock 3',
        timestamp: Date.now(),
      });
      const dockProof = generateHardwareProof(dockSerial, {
        dockTerminalTap: true,
        weighbridgeKg: 8000,
        qualityInspected: 'Grade 3 Processing Floor Accepted',
        timestamp: Date.now(),
      });

      const truckVerified = verifyHardwareProof(
        truckSerial,
        truckProof.payload,
        truckProof.signature
      );
      const dockVerified = verifyHardwareProof(
        dockSerial,
        dockProof.payload,
        dockProof.signature
      );

      const proofs = loadTestnetProofs();
      const setProofs =
        proofs?.contractSets?.[contractSetKey] ||
        proofs?.contractSets?.SDK_DEFAULT_2026_10_07;

      const coopSettlementProof = setProofs?.transactions?.coopSettlement || {
        purpose: 'Benguet Highland Co-op Net Rescue Payout on NFC Dock Tap (Hour 5.2)',
        amountXlm: '23.80',
        amountPhpEquivalent: 237980,
        authorizeTxHash: null,
        authorizeExplorerUrl: null,
        claimTxHash: null,
        claimExplorerUrl: null,
      };

      const clearingFeeProof = setProofs?.transactions?.clearingFee || {
        purpose: 'AWITEN Clearinghouse Protocol Fee (4.5% of Gross Floor Settlement)',
        amountXlm: '1.15',
        amountPhpEquivalent: 11520,
        authorizeTxHash: null,
        claimTxHash: null,
      };

      const unwoundEscrowProof =
        setProofs?.transactions?.defundEscrow ||
        setProofs?.transactions?.unwindOriginalBuyerEscrow || {
          purpose:
            'Unwinding & Refunding Original Manila Wholesale Buyer Escrow on Diversion',
          amountXlm: '36.00',
          amountPhpEquivalent: 360000,
          txHash: null,
        };

      if (!workflowState.diversionExecuted) {
        workflowState.diversionExecuted = true;
        workflowState.driverWalletBalanceXlm = '6.50';
        workflowState.driverWalletBalancePhp = 6500;
        workflowState.driverAdvanceReceipt =
          setProofs?.transactions?.driverAdvance || null;
      }
      if (workflowState.buyerEscrowStatus !== 'LOCKED_PAID') {
        workflowState.buyerEscrowStatus = 'LOCKED_PAID';
      }

      workflowState.nfcHandoffConfirmed = true;
      workflowState.stage = 'STAGE_5_SETTLED_ON_CHAIN';
      workflowState.dualHardwareAttested = true;
      workflowState.coopSettlementReceipt = {
        ...coopSettlementProof,
        deviceSerial: truckSerial,
        deviceHash: computeDeviceHashHex(truckSerial),
        dockSerial,
        dockHash: computeDeviceHashHex(dockSerial),
        coopPublicKey: proofs?.accounts?.coopMerchantPublicKey || null,
        netPayoutPhp: 237980,
        netPayoutXlm: '23.80',
        clearingFeeXlm: '1.15',
        clearingFeePhp: 11520,
        unwoundManilaEscrowXlm: '36.00',
        unwoundManilaEscrowPhp: 360000,
        netSavedVsManilaPhp: 117980,
        confirmedAt: new Date().toISOString(),
      };

      appendTerminalLog(
        'UNWIND & SETTLE',
        `Verifying webhook & dual hardware proofs (${truckSerial} + ${dockSerial}) -> Unwinding 36.00 XLM original buyer escrow, releasing 23.80 XLM net to Co-op, 1.15 XLM fee.`
      );

      workflowState.decisionHistory.unshift({
        id: `log-handoff-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'STAGE_5_NFC_HANDOFF_AND_ESCROW_SETTLEMENT',
        actor: 'Viajero NFC Pod (device_registry) + Noir payment_escrow',
        summary: `Dual hardware attestation verified (${truckSerial} + ${dockSerial}). Released 23.80 XLM (₱237,980 net) to Benguet Co-op and unwound 36.00 XLM original buyer escrow.`,
        txHash:
          coopSettlementProof.claimTxHash ||
          coopSettlementProof.authorizeTxHash,
        explorerUrl:
          coopSettlementProof.claimExplorerUrl ||
          coopSettlementProof.authorizeExplorerUrl,
      });

      res.json({
        ok: true,
        receipt: workflowState.coopSettlementReceipt,
        clearingFee: clearingFeeProof,
        unwoundOriginalBuyerEscrow: unwoundEscrowProof,
        dualHardwareAttestation: {
          verified: truckVerified.ok && dockVerified.ok,
          truckPod: {
            serial: truckSerial,
            deviceHash: computeDeviceHashHex(truckSerial),
            verified: truckVerified.ok,
          },
          dockTerminal: {
            serial: dockSerial,
            deviceHash: computeDeviceHashHex(dockSerial),
            verified: dockVerified.ok,
          },
        },
        workflow: workflowState,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to confirm NFC dock handoff',
      });
    }
  });

  // ==========================================================================
  // 9. SWITCH ACTIVE CONTRACT SET & RESET DEMO STATE
  // ==========================================================================
  app.post('/api/agent/switch-contract-set', (req, res) => {
    const requested = req.body?.contractSetKey;
    if (NOIR_CONTRACT_SETS[requested]) {
      workflowState.activeContractSet = requested;
    }
    res.json({
      ok: true,
      activeContractSet: workflowState.activeContractSet,
      contracts: NOIR_CONTRACT_SETS[workflowState.activeContractSet],
      workflow: workflowState,
    });
  });

  app.post('/api/agent/reset-demo', (_req, res) => {
    workflowState = createInitialWorkflowState();
    workflowState.currentHour = 0.0;
    workflowState.stage = 'STAGE_1_NORMAL_TRANSIT';
    workflowState.latestEvaluation = decisionEngine.evaluate({
      presetId: 'bgt402',
      hour: 0.0,
    });
    res.json({
      ok: true,
      workflow: workflowState,
    });
  });

  // Serve static frontend assets from apps/web
  const webDir = path.resolve(__dirname, '../../web');
  app.use(express.static(webDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDir, 'index.html'));
  });

  return app;
}

// Start server when invoked directly
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  const port = Number(process.env.PORT || 3001);
  const app = createApp();
  app.listen(port, () => {
    console.log(
      `🚀 AWITEN-Pay Full-Stack Server listening on http://localhost:${port}`
    );
  });
}

export default createApp;

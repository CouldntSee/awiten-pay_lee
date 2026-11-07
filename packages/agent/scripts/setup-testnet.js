import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Keypair } from '@stellar/stellar-sdk';
import {
  DEFAULT_PRIMARY_CONTRACT_SET,
  NOIR_CONTRACT_SETS,
  STELLAR_CONFIG,
  TRUCK_POD_DEVICE_SERIAL,
  DOCK_TERMINAL_DEVICE_SERIAL,
  DOCK_TERMINAL_DEVICE_HASH,
  getTestnetProofsPath,
  formatExplorerTxUrl,
} from '../../shared/src/index.js';
import {
  NoirService,
  computeDeviceHashHex,
  getNativeXlmSacAddress,
} from '../src/noir-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse a simple KEY=VALUE env file into an object while preserving existing keys.
 */
function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    result[key] = val;
  }
  return result;
}

/**
 * Fund a Stellar Testnet public key via Friendbot if it does not yet exist on Horizon.
 */
async function ensureFundedOnTestnet(publicKey, label) {
  const checkUrl = `${STELLAR_CONFIG.horizonUrl}/accounts/${publicKey}`;
  try {
    const checkRes = await fetch(checkUrl);
    if (checkRes.ok) {
      console.log(`  [Friendbot] ${label} (${publicKey.slice(0, 8)}...) already funded.`);
      return true;
    }
  } catch {
    // Proceed to Friendbot funding
  }

  console.log(`  [Friendbot] Funding ${label} (${publicKey})...`);
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Friendbot failed for ${label} (${publicKey}): ${res.status} ${text}`);
  }
  console.log(`  [Friendbot] Funded ${label} (${publicKey.slice(0, 8)}...) with 10,000 XLM.`);
  return true;
}

/**
 * Execute the full Noir lifecycle on a specific contract set:
 *   1. device_registry.register for truck pod (BGT-402-POD-ESP32S3)
 *   2. device_registry.register for dock terminal (BULACAN-DOCK3-NFC-TERMINAL)
 *   3. agent_registry.register_agent (maxAmount = 100 XLM)
 *   4. payment_escrow.fund_escrow (amount = 150 XLM operational escrow)
 *   5. payment_escrow.fund_escrow (amount = 36.00 XLM original Manila buyer invoice escrow)
 *   6. payment_escrow.defund_escrow (amount = 36.00 XLM unwinding original buyer escrow on diversion)
 *   7. payment_escrow.authorize + claim:
 *      - 1.00 XLM x402 traffic & weather oracle query
 *      - 6.50 XLM Viajero driver diversion fuel & toll advance
 *      - 1.15 XLM AWITEN clearing fee (4.5%)
 *      - 23.80 XLM Benguet Co-op net settlement
 */
async function provisionContractSet({
  contractSetKey,
  deviceSerial,
  deviceHash,
  dockSerial,
  dockHash,
  ownerKeypair,
  agentKeypair,
  driverKeypair,
  coopKeypair,
}) {
  const contractSet = NOIR_CONTRACT_SETS[contractSetKey];
  console.log(`\n======================================================================`);
  console.log(`Provisioning Noir Contract Set: ${contractSet.label} (${contractSetKey})`);
  console.log(`  device_registry : ${contractSet.deviceRegistry}`);
  console.log(`  agent_registry  : ${contractSet.agentRegistry}`);
  console.log(`  payment_escrow  : ${contractSet.paymentEscrow}`);
  console.log(`======================================================================`);

  const service = new NoirService({ contractSetKey });

  console.log(`  [1/8] Calling device_registry.register for Truck Pod ${deviceSerial}...`);
  const deviceReg = await service.registerDeviceOnChain({
    ownerSecret: ownerKeypair.secret(),
    deviceHash,
    agentPublicKey: agentKeypair.publicKey(),
  });
  console.log(
    `        -> txHash: ${deviceReg.txHash || 'ALREADY_REGISTERED_TO_OWNER'}`
  );

  console.log(`  [2/8] Calling device_registry.register for Dock Terminal ${dockSerial}...`);
  const dockReg = await service.registerDeviceOnChain({
    ownerSecret: ownerKeypair.secret(),
    deviceHash: dockHash,
    agentPublicKey: agentKeypair.publicKey(),
  });
  console.log(
    `        -> txHash: ${dockReg.txHash || 'ALREADY_REGISTERED_TO_OWNER'}`
  );

  console.log(`  [3/8] Calling agent_registry.register_agent (maxAmount: 100 XLM)...`);
  const policyReg = await service.registerAgentPolicy({
    ownerSecret: ownerKeypair.secret(),
    deviceHash,
    agentPublicKey: agentKeypair.publicKey(),
    maxAmountXlm: '100',
    expiresInHours: 72,
  });
  console.log(`        -> txHash: ${policyReg.txHash}`);

  console.log(`  [4/8] Calling payment_escrow.fund_escrow (operational escrow 150 XLM)...`);
  const escrowFund = await service.fundDeviceEscrow({
    ownerSecret: ownerKeypair.secret(),
    deviceHash,
    amountXlm: '150',
  });
  console.log(
    `        -> txHash: ${escrowFund.txHash} (Balance: ${escrowFund.newEscrowBalanceXlm} XLM)`
  );

  console.log(`  [5a/8] Funding Original Manila wholesale buyer invoice escrow (36.00 XLM)...`);
  const originalBuyerFund = await service.fundDeviceEscrow({
    ownerSecret: ownerKeypair.secret(),
    deviceHash,
    amountXlm: '36.00',
  });
  console.log(`        -> txHash: ${originalBuyerFund.txHash}`);

  console.log(`  [5b/8] Defunding / Unwinding Original Manila wholesale buyer escrow (36.00 XLM)...`);
  const originalBuyerDefund = await service.defundDeviceEscrow({
    ownerSecret: ownerKeypair.secret(),
    deviceHash,
    amountXlm: '36.00',
  });
  console.log(`        -> txHash: ${originalBuyerDefund.txHash}`);

  const baseNonce = BigInt(Date.now());

  console.log(`  [6/8] Executing Autonomous x402 Oracle Payment (1.00 XLM)...`);
  const oracleTx = await service.executeOracleQuery({
    agentSecret: agentKeypair.secret(),
    oracleMerchantSecret: coopKeypair.secret(),
    deviceHash,
    amountXlm: '1.00',
    nonce: baseNonce + 1n,
  });
  console.log(
    `        -> authorize txHash: ${oracleTx.authorizeTxHash}\n        -> claim txHash    : ${oracleTx.claimTxHash}`
  );

  console.log(`  [7/8] Executing Autonomous Driver Toll/Fuel Advance (6.50 XLM)...`);
  const driverAdvanceTx = await service.executeDriverAdvance({
    agentSecret: agentKeypair.secret(),
    driverMerchantSecret: driverKeypair.secret(),
    deviceHash,
    amountXlm: '6.50',
    nonce: baseNonce + 2n,
  });
  console.log(
    `        -> authorize txHash: ${driverAdvanceTx.authorizeTxHash}\n        -> claim txHash    : ${driverAdvanceTx.claimTxHash}`
  );

  console.log(`  [8a/8] Executing AWITEN Clearinghouse Success Fee (1.15 XLM)...`);
  const clearingFeeTx = await service.executeClearingFee({
    agentSecret: agentKeypair.secret(),
    treasuryMerchantSecret: ownerKeypair.secret(),
    deviceHash,
    amountXlm: '1.15',
    nonce: baseNonce + 3n,
  });
  console.log(
    `        -> authorize txHash: ${clearingFeeTx.authorizeTxHash}\n        -> claim txHash    : ${clearingFeeTx.claimTxHash}`
  );

  console.log(`  [8b/8] Executing Benguet Co-op Net Escrow Settlement (23.80 XLM)...`);
  const coopSettlementTx = await service.executeCoopSettlement({
    agentSecret: agentKeypair.secret(),
    coopMerchantSecret: coopKeypair.secret(),
    deviceHash,
    amountXlm: '23.80',
    nonce: baseNonce + 4n,
  });
  console.log(
    `        -> authorize txHash: ${coopSettlementTx.authorizeTxHash}\n        -> claim txHash    : ${coopSettlementTx.claimTxHash}`
  );

  const liveStatus = await service.getLiveOnChainStatus(deviceHash);

  return {
    contractSetKey,
    label: contractSet.label,
    contracts: {
      deviceRegistry: contractSet.deviceRegistry,
      agentRegistry: contractSet.agentRegistry,
      paymentEscrow: contractSet.paymentEscrow,
    },
    transactions: {
      registerDevice: {
        contract: contractSet.deviceRegistry,
        method: 'register',
        txHash: deviceReg.txHash,
        explorerUrl: formatExplorerTxUrl(deviceReg.txHash),
      },
      registerDockDevice: {
        contract: contractSet.deviceRegistry,
        method: 'register',
        deviceSerial: dockSerial,
        deviceHash: dockHash,
        txHash: dockReg.txHash,
        explorerUrl: formatExplorerTxUrl(dockReg.txHash),
      },
      registerAgent: {
        contract: contractSet.agentRegistry,
        method: 'register_agent',
        txHash: policyReg.txHash,
        explorerUrl: formatExplorerTxUrl(policyReg.txHash),
        maxAmountXlm: '100',
        expiresAt: policyReg.expiresAt,
      },
      fundEscrow: {
        contract: contractSet.paymentEscrow,
        method: 'fund_escrow',
        txHash: escrowFund.txHash,
        explorerUrl: formatExplorerTxUrl(escrowFund.txHash),
        fundedAmountXlm: '150',
      },
      oracleQuery: {
        purpose: 'x402 Traffic & Regional Weather Oracle Query (Hour 3.0)',
        amountXlm: '1.00',
        amountPhpEquivalent: 10000,
        nonce: oracleTx.nonce,
        authorizeTxHash: oracleTx.authorizeTxHash,
        authorizeExplorerUrl: oracleTx.authorizeExplorerUrl,
        claimTxHash: oracleTx.claimTxHash,
        claimExplorerUrl: oracleTx.claimExplorerUrl,
      },
      driverAdvance: {
        purpose: 'Mang Ramon NLEX Toll & Diesel Diversion Advance (Hour 4.5)',
        amountXlm: '6.50',
        amountPhpEquivalent: 6500,
        nonce: driverAdvanceTx.nonce,
        authorizeTxHash: driverAdvanceTx.authorizeTxHash,
        authorizeExplorerUrl: driverAdvanceTx.authorizeExplorerUrl,
        claimTxHash: driverAdvanceTx.claimTxHash,
        claimExplorerUrl: driverAdvanceTx.claimExplorerUrl,
      },
      fundOriginalBuyerEscrow: {
        contract: contractSet.paymentEscrow,
        method: 'fund_escrow',
        purpose: 'Original Balintawak Manila Wholesale Buyer Escrow Invoice (8t Cabbage)',
        amountXlm: '36.00',
        amountPhpEquivalent: 360000,
        txHash: originalBuyerFund.txHash,
        explorerUrl: formatExplorerTxUrl(originalBuyerFund.txHash),
      },
      defundEscrow: {
        contract: contractSet.paymentEscrow,
        method: 'defund_escrow',
        purpose: 'Unwinding & Refunding Original Manila Wholesale Buyer Escrow on Diversion',
        amountXlm: '36.00',
        amountPhpEquivalent: 360000,
        txHash: originalBuyerDefund.txHash,
        explorerUrl: formatExplorerTxUrl(originalBuyerDefund.txHash),
      },
      unwindOriginalBuyerEscrow: {
        contract: contractSet.paymentEscrow,
        method: 'defund_escrow',
        purpose: 'Unwinding & Refunding Original Manila Wholesale Buyer Escrow on Diversion',
        amountXlm: '36.00',
        amountPhpEquivalent: 360000,
        txHash: originalBuyerDefund.txHash,
        explorerUrl: formatExplorerTxUrl(originalBuyerDefund.txHash),
      },
      clearingFee: {
        purpose: 'AWITEN Clearinghouse Protocol Fee (4.5% of Gross Floor Settlement)',
        amountXlm: '1.15',
        amountPhpEquivalent: 11520,
        authorizeTxHash: clearingFeeTx.authorizeTxHash,
        authorizeExplorerUrl: clearingFeeTx.authorizeExplorerUrl,
        claimTxHash: clearingFeeTx.claimTxHash,
        claimExplorerUrl: clearingFeeTx.claimExplorerUrl,
      },
      coopSettlement: {
        purpose: 'Benguet Highland Co-op Net Rescue Payout on NFC Dock Tap (Hour 5.2)',
        amountXlm: '23.80',
        amountPhpEquivalent: 237980,
        nonce: coopSettlementTx.nonce,
        authorizeTxHash: coopSettlementTx.authorizeTxHash,
        authorizeExplorerUrl: coopSettlementTx.authorizeExplorerUrl,
        claimTxHash: coopSettlementTx.claimTxHash,
        claimExplorerUrl: coopSettlementTx.claimExplorerUrl,
      },
    },
    finalEscrowBalanceXlm: liveStatus.escrowBalanceXlm,
  };
}

async function main() {
  console.log('[SETUP] AWITEN-Pay — Live Stellar Testnet Provisioner (Noir x Velo)');

  const aiBrainPrivateEnv = path.resolve(
    __dirname,
    '../../../../../09_Private/velo_hackathon_env.local'
  );
  const scratchEnvPath = '/Users/kylexavier/.gemini/antigravity/scratch/awiten-pay/.env';

  const existingEnv = {
    ...parseEnvFile(scratchEnvPath),
    ...parseEnvFile(aiBrainPrivateEnv),
  };

  const getOrCreateKeypair = (secretEnvKey) => {
    const existingSecret = process.env[secretEnvKey] || existingEnv[secretEnvKey];
    if (existingSecret && existingSecret.startsWith('S') && existingSecret.length === 56) {
      return Keypair.fromSecret(existingSecret);
    }
    return Keypair.random();
  };

  const ownerKeypair = getOrCreateKeypair('OWNER_SECRET_KEY');
  const agentKeypair = getOrCreateKeypair('AGENT_SECRET_KEY');
  const driverKeypair = getOrCreateKeypair('DRIVER_MERCHANT_SECRET_KEY');
  const coopKeypair = getOrCreateKeypair('COOP_MERCHANT_SECRET_KEY');

  const mergedEnv = {
    ...existingEnv,
    STELLAR_NETWORK: 'testnet',
    STELLAR_RPC_URL: STELLAR_CONFIG.rpcUrl,
    STELLAR_HORIZON_URL: STELLAR_CONFIG.horizonUrl,
    NOIR_DEVICE_REGISTRY_CONTRACT_ID:
      NOIR_CONTRACT_SETS.HANDBOOK_2026_10_24.deviceRegistry,
    NOIR_AGENT_REGISTRY_CONTRACT_ID:
      NOIR_CONTRACT_SETS.HANDBOOK_2026_10_24.agentRegistry,
    NOIR_PAYMENT_ESCROW_CONTRACT_ID:
      NOIR_CONTRACT_SETS.HANDBOOK_2026_10_24.paymentEscrow,
    NOIR_LEGACY_DEVICE_REGISTRY_CONTRACT_ID:
      NOIR_CONTRACT_SETS.SDK_DEFAULT_2026_10_07.deviceRegistry,
    NOIR_LEGACY_AGENT_REGISTRY_CONTRACT_ID:
      NOIR_CONTRACT_SETS.SDK_DEFAULT_2026_10_07.agentRegistry,
    NOIR_LEGACY_PAYMENT_ESCROW_CONTRACT_ID:
      NOIR_CONTRACT_SETS.SDK_DEFAULT_2026_10_07.paymentEscrow,
    OWNER_SECRET_KEY: ownerKeypair.secret(),
    OWNER_PUBLIC_KEY: ownerKeypair.publicKey(),
    AGENT_SECRET_KEY: agentKeypair.secret(),
    AGENT_PUBLIC_KEY: agentKeypair.publicKey(),
    DRIVER_MERCHANT_SECRET_KEY: driverKeypair.secret(),
    DRIVER_MERCHANT_PUBLIC_KEY: driverKeypair.publicKey(),
    COOP_MERCHANT_SECRET_KEY: coopKeypair.secret(),
    MERCHANT_PUBLIC_KEY: coopKeypair.publicKey(),
    VELO_API_KEY: existingEnv.VELO_API_KEY || 'velo_test_YOUR_KEY_HERE',
    VELO_WEBHOOK_SECRET:
      existingEnv.VELO_WEBHOOK_SECRET || 'whsec_awiten_pay_testnet_signing_secret_2026',
    PORT: existingEnv.PORT || '3001',
    FRONTEND_URL: existingEnv.FRONTEND_URL || 'http://localhost:3001',
  };

  const serializedEnv =
    Object.entries(mergedEnv)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n';

  if (fs.existsSync(path.dirname(aiBrainPrivateEnv))) {
    fs.writeFileSync(aiBrainPrivateEnv, serializedEnv, 'utf8');
  }
  if (fs.existsSync(path.dirname(scratchEnvPath))) {
    fs.writeFileSync(scratchEnvPath, serializedEnv, 'utf8');
  }

  await ensureFundedOnTestnet(ownerKeypair.publicKey(), 'COOP_OWNER_WALLET');
  await ensureFundedOnTestnet(agentKeypair.publicKey(), 'AWITEN_AUTONOMOUS_AGENT');
  await ensureFundedOnTestnet(driverKeypair.publicKey(), 'MANG_RAMON_DRIVER_WALLET');
  await ensureFundedOnTestnet(coopKeypair.publicKey(), 'BENGUET_COOP_TREASURY');

  const deviceSerial = TRUCK_POD_DEVICE_SERIAL;
  const deviceHash = computeDeviceHashHex(deviceSerial);
  const dockSerial = DOCK_TERMINAL_DEVICE_SERIAL;
  const dockHash = computeDeviceHashHex(dockSerial);
  const nativeXlmSac = getNativeXlmSacAddress();

  const sdkDefaultProofs = await provisionContractSet({
    contractSetKey: 'SDK_DEFAULT_2026_10_07',
    deviceSerial,
    deviceHash,
    dockSerial,
    dockHash,
    ownerKeypair,
    agentKeypair,
    driverKeypair,
    coopKeypair,
  });

  const handbookProofs = await provisionContractSet({
    contractSetKey: 'HANDBOOK_2026_10_24',
    deviceSerial,
    deviceHash,
    dockSerial,
    dockHash,
    ownerKeypair,
    agentKeypair,
    driverKeypair,
    coopKeypair,
  });

  const existingProofsPath = getTestnetProofsPath();
  if (fs.existsSync(existingProofsPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(existingProofsPath, 'utf8'));
      for (const setKey of ['SDK_DEFAULT_2026_10_07', 'HANDBOOK_2026_10_24']) {
        const target = setKey === 'SDK_DEFAULT_2026_10_07' ? sdkDefaultProofs : handbookProofs;
        const prevTxs = prev?.contractSets?.[setKey]?.transactions;
        if (!target.transactions.registerDevice.txHash && prevTxs?.registerDevice?.txHash) {
          target.transactions.registerDevice = prevTxs.registerDevice;
        }
        if (!target.transactions.registerDockDevice.txHash && prevTxs?.registerDockDevice?.txHash) {
          target.transactions.registerDockDevice = prevTxs.registerDockDevice;
        }
      }
    } catch {
      // Ignore parse error
    }
  }

  const proofsPayload = {
    generatedAt: new Date().toISOString(),
    network: 'Stellar Testnet',
    rpcUrl: STELLAR_CONFIG.rpcUrl,
    horizonUrl: STELLAR_CONFIG.horizonUrl,
    nativeXlmSacAddress: nativeXlmSac,
    deviceSerial,
    deviceHash,
    dockDeviceSerial: dockSerial,
    dockDeviceHash: dockHash,
    accounts: {
      ownerPublicKey: ownerKeypair.publicKey(),
      agentPublicKey: agentKeypair.publicKey(),
      driverMerchantPublicKey: driverKeypair.publicKey(),
      coopMerchantPublicKey: coopKeypair.publicKey(),
    },
    primaryContractSet: DEFAULT_PRIMARY_CONTRACT_SET,
    contractSets: {
      SDK_DEFAULT_2026_10_07: sdkDefaultProofs,
      HANDBOOK_2026_10_24: handbookProofs,
    },
  };

  fs.writeFileSync(
    existingProofsPath,
    JSON.stringify(proofsPayload, null, 2) + '\n',
    'utf8'
  );

  console.log(`\n[DONE] Wrote verified Stellar Testnet proofs to: ${existingProofsPath}`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  main().catch((err) => {
    console.error('[ERROR] setup-testnet failed:', err);
    process.exit(1);
  });
}

export { provisionContractSet };

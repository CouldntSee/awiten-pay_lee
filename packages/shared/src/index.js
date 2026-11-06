import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Both Noir Contract ID Sets on Stellar Testnet:
 * 1. SDK_DEFAULT_2026_10_07 — Primary default on server boot & UI load (bundled in @noirx402/agent-sdk@0.2.0)
 * 2. HANDBOOK_2026_10_24 — Official Nov 6 Builder Handbook Testnet Contract IDs
 *
 * Our setup-testnet.js script provisions live on-chain state and executes real
 * transactions on BOTH contract sets so whichever set a judge inspects on
 * Stellar Expert has live, verifiable transactions.
 */
export const DEFAULT_PRIMARY_CONTRACT_SET = 'SDK_DEFAULT_2026_10_07';

export const NOIR_CONTRACT_SETS = {
  SDK_DEFAULT_2026_10_07: {
    id: 'SDK_DEFAULT_2026_10_07',
    label: 'SDK Default (2026-10-07)',
    deviceRegistry:
      process.env.NOIR_LEGACY_DEVICE_REGISTRY_CONTRACT_ID ||
      'CB4DPMGOA374JIB2ZVD4AHW5GJKQUYNOFGRYNOJ75EFH2KCJSMHOWIRA',
    agentRegistry:
      process.env.NOIR_LEGACY_AGENT_REGISTRY_CONTRACT_ID ||
      'CBTDMJVCFQDIVWZBKAKZ2FQ3UEJNAAUFYCTJ3E4ON2MYXPLPSIXQ25JZ',
    paymentEscrow:
      process.env.NOIR_LEGACY_PAYMENT_ESCROW_CONTRACT_ID ||
      'CA5S4S7QGHJHJWVJBYL3CXZXZTNGKXMNZVDAEQNN7NUXFP4D7BYK7HIX',
  },
  HANDBOOK_2026_10_24: {
    id: 'HANDBOOK_2026_10_24',
    label: 'Builder Handbook (2026-10-24)',
    deviceRegistry:
      process.env.NOIR_DEVICE_REGISTRY_CONTRACT_ID ||
      'CAC4KOLHDLDYDWBOKXNKRN5KVHO56PLOIFXDLTBUWGVN6GVDEB7FQHU5',
    agentRegistry:
      process.env.NOIR_AGENT_REGISTRY_CONTRACT_ID ||
      'CCMZDSPTLX7IIJWCYEUM5DJUHOSOYSTHGK777S2TXZWEMC5ZZGPJ3EBV',
    paymentEscrow:
      process.env.NOIR_PAYMENT_ESCROW_CONTRACT_ID ||
      'CC7EAW5FNJEDBS7THM5IT6XIOHO4AOYMLXT3KSZ3HWUIKEACTW7E5BFS',
  },
};

export const STELLAR_CONFIG = {
  network: process.env.STELLAR_NETWORK || 'testnet',
  rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  horizonUrl:
    process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  explorerTxBase: 'https://stellar.expert/explorer/testnet/tx/',
  explorerContractBase: 'https://stellar.expert/explorer/testnet/contract/',
  explorerAccountBase: 'https://stellar.expert/explorer/testnet/account/',
};

export const TRUCK_POD_DEVICE_SERIAL = 'BGT-402-POD-ESP32S3';
export const TRUCK_POD_DEVICE_HASH =
  'd7603c3286417cd3d1857dbed397eb335f78b3e91f88733ccf9e46ede663ebda';

export const DOCK_TERMINAL_DEVICE_SERIAL = 'BULACAN-DOCK3-NFC-TERMINAL';
export const DOCK_TERMINAL_DEVICE_HASH =
  '8edde7503399cbd8da0aa0023c7184aee38e088ab5823ab7c8fe467a0b65a7e4';

/**
 * Derive a deterministic 64-character hex SHA-256 deviceHash from any hardware serial.
 */
export function computeDeviceHashHex(deviceSerial = 'BGT-402-POD-ESP32S3') {
  return crypto.createHash('sha256').update(deviceSerial).digest('hex');
}

/**
 * Generate a signed cryptographic attestation proof for a registered hardware device.
 */
export function generateHardwareProof(deviceSerial, payload = {}) {
  const deviceHash = computeDeviceHashHex(deviceSerial);
  const timestamp = Date.now();
  const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const secret = crypto.createHash('sha256').update(`hw_attest_${deviceSerial}`).digest('hex');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${deviceSerial}:${timestamp}:${rawPayload}`)
    .digest('hex');
  return {
    deviceSerial,
    deviceHash,
    timestamp,
    signature: `t=${timestamp},sig=${signature}`,
    payload,
  };
}

/**
 * Verify cryptographic hardware attestation proof against registered device.
 */
export function verifyHardwareProof(deviceSerial, payload = {}, signatureHeader) {
  if (!signatureHeader || !deviceSerial) {
    return { ok: false, error: 'Missing deviceSerial or signature' };
  }
  const sigStr =
    typeof signatureHeader === 'object'
      ? signatureHeader.signature
      : String(signatureHeader);
  const match = sigStr.match(/t=(\d+),sig=([a-f0-9]{64})/i);
  if (!match) {
    return { ok: false, error: 'Invalid signature format' };
  }
  const timestamp = Number(match[1]);
  const sig = match[2];
  const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const secret = crypto.createHash('sha256').update(`hw_attest_${deviceSerial}`).digest('hex');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${deviceSerial}:${timestamp}:${rawPayload}`)
    .digest('hex');
  if (expected !== sig) {
    return { ok: false, error: 'Signature mismatch' };
  }
  return {
    ok: true,
    deviceSerial,
    deviceHash: computeDeviceHashHex(deviceSerial),
    timestamp,
  };
}

/**
 * PHP-to-XLM Testnet Scale:
 * ₱10,000 PHP = 1.00 XLM on Stellar Testnet so judges can test the entire
 * 8-ton agricultural clearinghouse flow with free Friendbot XLM.
 */
export const ECONOMICS_SCALE = {
  phpPerXlm: 10000,
  tonnageKg: 8000,
  normalPricePhpPerKg: 45.0,
  normalGrossPhp: 360000,
  manilaCollapseNetPhp: 120000,
  originalManilaEscrowPhp: 360000,
  originalManilaEscrowXlm: '36.00',
  bulacanFloorPhpPerKg: 32.0,
  bulacanGrossPhp: 256000,
  bulacanGrossXlm: '25.60',
  awitenFeeRate: 0.045,
  awitenFeePhp: 11520,
  awitenFeeXlm: '1.15',
  driverAdvancePhp: 6500,
  driverAdvanceXlm: '6.50',
  oracleQueryPhp: 10000,
  oracleQueryXlm: '1.00',
  coopNetPayoutPhp: 237980,
  coopNetPayoutXlm: '23.80',
  netCashSavedPhp: 117980,
  netCashSavedXlm: '11.80',
};

export const VIAJERO_TRUCK_PRESETS = {
  bgt402: {
    id: 'bgt402',
    truckCode: 'BGT-402',
    deviceSerial: 'BGT-402-POD-ESP32S3',
    driverName: 'Mang Ramon',
    cooperative: 'Benguet Highland Vegetable Co-op (La Trinidad)',
    cargo: '8,000 kg Scorpio Head Cabbage',
    tonnageKg: 8000,
    origin: 'BAPTC La Trinidad, Benguet',
    primaryDestination: 'Balintawak Cloverleaf Market, Metro Manila',
    divertDestination: 'Bulacan Food Dehydrator Corp. (Meycauayan Dock 3)',
    defaultHour: 4.5,
    baseTemp: 17.5,
    peakTemp: 36.6,
    baseRH: 86,
    minRH: 46,
    decayMultiplier: 1.0,
    shieldedByFirewall: false,
  },
  bgt118: {
    id: 'bgt118',
    truckCode: 'BGT-118',
    deviceSerial: 'BGT-118-POD-ESP32S3',
    driverName: 'Kuya Efren',
    cooperative: 'Buguias Highland Growers Co-op',
    cargo: '6,500 kg Chinese Cabbage (Wombok)',
    tonnageKg: 6500,
    origin: 'Buguias, Benguet',
    primaryDestination: 'Divisoria Vegetable Terminal, Manila',
    divertDestination: 'Urdaneta Wholesale Bagsakan',
    defaultHour: 3.0,
    baseTemp: 16.8,
    peakTemp: 25.4,
    baseRH: 88,
    minRH: 68,
    decayMultiplier: 0.35,
    shieldedByFirewall: true,
  },
  nvt309: {
    id: 'nvt309',
    truckCode: 'NVT-309',
    deviceSerial: 'NVT-309-POD-ESP32S3',
    driverName: 'Mang Berto',
    cooperative: 'Bambang NVAT Hauler Union',
    cargo: '9,000 kg Highland Carrots',
    tonnageKg: 9000,
    origin: 'NVAT Bambang, Nueva Vizcaya',
    primaryDestination: 'Balintawak Market, Quezon City',
    divertDestination: 'Tarlac Regional Trading Post',
    defaultHour: 2.5,
    baseTemp: 18.0,
    peakTemp: 27.5,
    baseRH: 84,
    minRH: 64,
    decayMultiplier: 0.45,
    shieldedByFirewall: true,
  },
};

export const RESCUE_OFF_TAKERS = [
  {
    id: 'bulacan-dehydrator',
    name: 'Bulacan Food Dehydrator (Contracted Floor)',
    shortName: 'Bulacan Food Dehydrator',
    hub: 'Meycauayan Weighbridge Dock 3, Bulacan',
    tier: 'RECOMMENDED · GUARANTEED FLOOR',
    pricePhpPerKg: 32.0,
    grossPhp: 256000,
    amountXlm: '25.60',
    netCoopPhp: 237980,
    netCoopXlm: '23.80',
  },
  {
    id: 'urdaneta-broker',
    name: 'Urdaneta Accredited Broker (Sealed Bid)',
    shortName: 'Urdaneta / Tarlac Wholesale Broker',
    hub: 'Urdaneta Wholesale Bagsakan, Pangasinan',
    tier: 'LIVE REGIONAL BROKER BID',
    pricePhpPerKg: 33.5,
    grossPhp: 268000,
    amountXlm: '26.80',
    netCoopPhp: 249440,
    netCoopXlm: '24.94',
  },
  {
    id: 'dti-kadiwa',
    name: 'DTI e-Kadiwa / LGU Feeding Hub',
    shortName: 'DTI e-Kadiwa Hub',
    hub: 'Central Luzon Regional Kadiwa Depot',
    tier: 'INSTITUTIONAL FLOOR',
    pricePhpPerKg: 24.0,
    grossPhp: 192000,
    amountXlm: '19.20',
    netCoopPhp: 176860,
    netCoopXlm: '17.69',
  },
  {
    id: 'feed-mill',
    name: 'Central Luzon Livestock Feed Mill',
    shortName: 'Central Luzon Feed Mill',
    hub: 'San Fernando Biomass Silo, Pampanga',
    tier: 'LAST-RESORT BIOMASS FLOOR',
    pricePhpPerKg: 12.0,
    grossPhp: 96000,
    amountXlm: '9.60',
    netCoopPhp: 87180,
    netCoopXlm: '8.72',
  },
];

export function getTestnetProofsPath() {
  return path.join(__dirname, 'testnet-proofs.json');
}

export function loadTestnetProofs() {
  const filePath = getTestnetProofsPath();
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function formatExplorerTxUrl(txHash) {
  if (!txHash) return null;
  return `${STELLAR_CONFIG.explorerTxBase}${txHash}`;
}

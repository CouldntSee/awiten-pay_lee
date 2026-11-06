import crypto from 'node:crypto';
import {
  NoirAgentClient,
  keypairSigner,
  deviceHashScVal,
  normalizeDeviceHash,
  toStroops,
  fromStroops,
  verifyWebhookSignature as verifyNoirWebhookSignature,
} from '@noirx402/agent-sdk';
import {
  Address,
  Asset,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  DEFAULT_PRIMARY_CONTRACT_SET,
  NOIR_CONTRACT_SETS,
  STELLAR_CONFIG,
  TRUCK_POD_DEVICE_SERIAL,
  DOCK_TERMINAL_DEVICE_SERIAL,
  loadTestnetProofs,
  formatExplorerTxUrl,
  generateHardwareProof,
  verifyHardwareProof,
} from '../../shared/src/index.js';

export { generateHardwareProof, verifyHardwareProof };

/**
 * Derive a deterministic 64-character hex SHA-256 deviceHash from any hardware serial.
 */
export function computeDeviceHashHex(deviceSerial = TRUCK_POD_DEVICE_SERIAL) {
  const digest = crypto.createHash('sha256').update(deviceSerial).digest('hex');
  return normalizeDeviceHash(digest);
}

/**
 * Return the Stellar Testnet SAC (Stellar Asset Contract) address for native XLM.
 */
export function getNativeXlmSacAddress() {
  return Asset.native().contractId(Networks.TESTNET);
}

/**
 * Create a NoirAgentClient configured for either:
 *   - 'SDK_DEFAULT_2026_10_07' (Primary Default, bundled in @noirx402/agent-sdk@0.2.0)
 *   - 'HANDBOOK_2026_10_24' (Nov 6 Builder Handbook Contract IDs)
 */
export function createNoirClient(contractSetKey = DEFAULT_PRIMARY_CONTRACT_SET) {
  const contractSet =
    NOIR_CONTRACT_SETS[contractSetKey] ||
    NOIR_CONTRACT_SETS.SDK_DEFAULT_2026_10_07 ||
    NOIR_CONTRACT_SETS.HANDBOOK_2026_10_24;

  return new NoirAgentClient({
    rpcUrl: STELLAR_CONFIG.rpcUrl,
    network: {
      rpcUrl: STELLAR_CONFIG.rpcUrl,
      networkPassphrase: Networks.TESTNET,
      contracts: {
        deviceRegistry: contractSet.deviceRegistry,
        agentRegistry: contractSet.agentRegistry,
        paymentEscrow: contractSet.paymentEscrow,
      },
    },
  });
}

/**
 * AWITEN-Pay Noir Service wrapping @noirx402/agent-sdk for:
 *   1. device_registry.register(wallet, device_hash, agent)
 *   2. agent_registry.register_agent via noir.execute(ownerSigner, { kind: 'registerAgent', ... })
 *   3. payment_escrow.fund_escrow via noir.execute(ownerSigner, { kind: 'fundEscrow', ... })
 *   4. payment_escrow.defund_escrow via noir.execute(ownerSigner, { kind: 'defundEscrow', ... })
 *   5. payment_escrow.authorize + claim for:
 *      - x402 oracle queries (1.00 XLM)
 *      - driver toll/fuel advance (6.50 XLM)
 *      - AWITEN clearing fee (1.15 XLM)
 *      - co-op net settlement (23.80 XLM)
 *   6. Live read queries: getDeviceOwner, getPolicy, getEscrowBalance, getPendingBalance, checkPayment
 */
export class NoirService {
  constructor(options = {}) {
    this.contractSetKey = options.contractSetKey || DEFAULT_PRIMARY_CONTRACT_SET;
    this.noir = createNoirClient(this.contractSetKey);
    this.nativeAssetAddress = getNativeXlmSacAddress();
    this.verifyNoirWebhookSignature = verifyNoirWebhookSignature;
  }

  /**
   * 1. Register a hardware device's 32-byte SHA-256 device_hash in device_registry.
   *    Soroban signature: register(wallet: Address, device_hash: BytesN<32>, agent: Address)
   *    Requires wallet.require_auth() signed by the owner account.
   */
  async registerDeviceOnChain({ ownerSecret, deviceHash, agentPublicKey }) {
    const normalizedHash = normalizeDeviceHash(deviceHash);
    const existingOwner = await this.noir.getDeviceOwner(normalizedHash);
    const ownerKeypair = Keypair.fromSecret(ownerSecret);
    const ownerPublicKey = ownerKeypair.publicKey();

    if (existingOwner && existingOwner === ownerPublicKey) {
      return {
        alreadyRegistered: true,
        ownerPublicKey,
        deviceHash: normalizedHash,
        txHash: null,
      };
    }

    const account = await this.noir.server.getAccount(ownerPublicKey);
    const contract = new Contract(this.noir.contracts.deviceRegistry);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'register',
          new Address(ownerPublicKey).toScVal(),
          deviceHashScVal(normalizedHash),
          new Address(agentPublicKey).toScVal()
        )
      )
      .setTimeout(300)
      .build();

    const prepared = await this.noir.server.prepareTransaction(tx);
    prepared.sign(ownerKeypair);
    const txHash = await this.noir.submit(prepared.toXDR());

    return {
      alreadyRegistered: false,
      ownerPublicKey,
      deviceHash: normalizedHash,
      txHash,
      explorerUrl: formatExplorerTxUrl(txHash),
    };
  }

  /**
   * 2. Register an autonomous spending policy in agent_registry via @noirx402/agent-sdk:
   *    noir.execute(ownerSigner, { kind: 'registerAgent', deviceHash, agent, asset, maxAmount, expiresAt })
   */
  async registerAgentPolicy({
    ownerSecret,
    deviceHash,
    agentPublicKey,
    maxAmountXlm = '100',
    expiresInHours = 72,
  }) {
    const normalizedHash = normalizeDeviceHash(deviceHash);
    const ownerSigner = keypairSigner(ownerSecret);
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);
    const maxAmount = toStroops(maxAmountXlm);

    const { hash } = await this.noir.execute(ownerSigner, {
      kind: 'registerAgent',
      deviceHash: normalizedHash,
      agent: agentPublicKey,
      asset: this.nativeAssetAddress,
      maxAmount,
      expiresAt,
    });

    return {
      txHash: hash,
      explorerUrl: formatExplorerTxUrl(hash),
      deviceHash: normalizedHash,
      agentPublicKey,
      asset: this.nativeAssetAddress,
      maxAmountStroops: maxAmount.toString(),
      maxAmountXlm,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * 3. Pre-fund the device's operational/shipment escrow in payment_escrow:
   *    noir.execute(ownerSigner, { kind: 'fundEscrow', deviceHash, token, amount })
   */
  async fundDeviceEscrow({ ownerSecret, deviceHash, amountXlm = '150' }) {
    const normalizedHash = normalizeDeviceHash(deviceHash);
    const ownerSigner = keypairSigner(ownerSecret);
    const amount = toStroops(amountXlm);

    const { hash } = await this.noir.execute(ownerSigner, {
      kind: 'fundEscrow',
      deviceHash: normalizedHash,
      token: this.nativeAssetAddress,
      amount,
    });

    const balanceStroops = await this.noir.getEscrowBalance(normalizedHash);

    return {
      txHash: hash,
      explorerUrl: formatExplorerTxUrl(hash),
      deviceHash: normalizedHash,
      amountXlm,
      newEscrowBalanceXlm: fromStroops(balanceStroops),
    };
  }

  /**
   * 4. Defund / unwind escrow from payment_escrow back to owner:
   *    noir.execute(ownerSigner, { kind: 'defundEscrow', deviceHash, token, amount })
   */
  async defundDeviceEscrow({ ownerSecret, deviceHash, amountXlm = '36.00' }) {
    const normalizedHash = normalizeDeviceHash(deviceHash);
    const ownerSigner = keypairSigner(ownerSecret);
    const amount = toStroops(amountXlm);

    const { hash } = await this.noir.execute(ownerSigner, {
      kind: 'defundEscrow',
      deviceHash: normalizedHash,
      token: this.nativeAssetAddress,
      amount,
    });

    const balanceStroops = await this.noir.getEscrowBalance(normalizedHash);

    return {
      txHash: hash,
      explorerUrl: formatExplorerTxUrl(hash),
      deviceHash: normalizedHash,
      amountXlm,
      newEscrowBalanceXlm: fromStroops(balanceStroops),
    };
  }

  /**
   * Internal helper to check policy + authorize + claim an autonomous disbursement
   */
  async _authorizeAndClaim({
    agentSecret,
    merchantSecret,
    deviceHash,
    amountXlm,
    purpose,
    nonce,
  }) {
    const normalizedHash = normalizeDeviceHash(deviceHash);
    const agentSigner = keypairSigner(agentSecret);
    const merchantSigner = keypairSigner(merchantSecret);
    const amount = toStroops(amountXlm);

    const check = await this.noir.checkPayment({
      deviceHash: normalizedHash,
      agent: agentSigner.publicKey,
      asset: this.nativeAssetAddress,
      amount,
    });

    if (!check.ok) {
      throw new Error(
        `Noir checkPayment refused ${purpose} (${amountXlm} XLM): ${check.reason}`
      );
    }

    const authResult = await this.noir.authorizePayment({
      agent: agentSigner,
      deviceHash: normalizedHash,
      merchant: merchantSigner.publicKey,
      asset: this.nativeAssetAddress,
      amount,
      ...(nonce ? { nonce: BigInt(nonce) } : {}),
    });

    const claimResult = await this.noir.claim({
      merchant: merchantSigner,
      token: this.nativeAssetAddress,
    });

    return {
      purpose,
      amountXlm,
      amountStroops: amount.toString(),
      merchantPublicKey: merchantSigner.publicKey,
      nonce: authResult.nonce.toString(),
      authorizeTxHash: authResult.hash,
      authorizeExplorerUrl: formatExplorerTxUrl(authResult.hash),
      claimTxHash: claimResult.hash,
      claimExplorerUrl: formatExplorerTxUrl(claimResult.hash),
    };
  }

  /**
   * 5a. Execute autonomous 1.00 XLM x402 traffic & weather oracle payment
   */
  async executeOracleQuery({
    agentSecret,
    oracleMerchantSecret,
    deviceHash,
    amountXlm = '1.00',
    nonce,
  }) {
    return this._authorizeAndClaim({
      agentSecret,
      merchantSecret: oracleMerchantSecret,
      deviceHash,
      amountXlm,
      purpose: 'x402_traffic_weather_oracle_query',
      nonce,
    });
  }

  /**
   * 5b. Execute autonomous 6.50 XLM (₱6,500 PHP Eq.) Viajero driver toll & diesel advance
   */
  async executeDriverAdvance({
    agentSecret,
    driverMerchantSecret,
    deviceHash,
    amountXlm = '6.50',
    nonce,
  }) {
    return this._authorizeAndClaim({
      agentSecret,
      merchantSecret: driverMerchantSecret,
      deviceHash,
      amountXlm,
      purpose: 'viajero_driver_diversion_fuel_toll_advance',
      nonce,
    });
  }

  /**
   * 5c. Execute 1.15 XLM (₱11,520 PHP Eq. 4.5%) AWITEN Clearinghouse Protocol Fee
   */
  async executeClearingFee({
    agentSecret,
    treasuryMerchantSecret,
    deviceHash,
    amountXlm = '1.15',
    nonce,
  }) {
    return this._authorizeAndClaim({
      agentSecret,
      merchantSecret: treasuryMerchantSecret,
      deviceHash,
      amountXlm,
      purpose: 'awiten_clearinghouse_protocol_fee',
      nonce,
    });
  }

  /**
   * 5d. Execute final 23.80 XLM (₱237,980 PHP Eq.) Benguet Co-op net settlement upon NFC dock handoff
   */
  async executeCoopSettlement({
    agentSecret,
    coopMerchantSecret,
    deviceHash,
    amountXlm = '23.80',
    nonce,
  }) {
    return this._authorizeAndClaim({
      agentSecret,
      merchantSecret: coopMerchantSecret,
      deviceHash,
      amountXlm,
      purpose: 'benguet_coop_nfc_handoff_net_settlement',
      nonce,
    });
  }

  /**
   * 6. Client HTTP 402 challenge-response handler:
   *    Calls GET /api/x402/route-weather-oracle, intercepts 402 Payment Required,
   *    pays 1.00 XLM via @noirx402/agent-sdk, and retries with `x-noir-payment-tx`.
   */
  async fetchOracleWith402Payment({
    baseUrl = 'http://127.0.0.1:3001',
    agentSecret,
    oracleMerchantSecret,
    deviceHash = computeDeviceHashHex(TRUCK_POD_DEVICE_SERIAL),
  } = {}) {
    const oracleUrl = `${baseUrl}/api/x402/route-weather-oracle`;
    const initialRes = await fetch(oracleUrl);

    if (initialRes.status === 402) {
      const priceHeader = initialRes.headers.get('x-402-price') || '1.00 XLM';
      const amountXlm = priceHeader.split(' ')[0] || '1.00';
      let txHash;

      if (agentSecret && oracleMerchantSecret) {
        const paymentRes = await this.executeOracleQuery({
          agentSecret,
          oracleMerchantSecret,
          deviceHash,
          amountXlm,
        });
        txHash = paymentRes.claimTxHash || paymentRes.authorizeTxHash;
      } else {
        const proofs = loadTestnetProofs();
        const setTxs =
          proofs?.contractSets?.[this.contractSetKey]?.transactions ||
          proofs?.contractSets?.SDK_DEFAULT_2026_10_07?.transactions;
        txHash =
          setTxs?.oracleQuery?.claimTxHash ||
          setTxs?.oracleQuery?.authorizeTxHash;
      }

      const retryRes = await fetch(oracleUrl, {
        headers: {
          'x-noir-payment-tx': txHash,
        },
      });

      const retryData = await retryRes.json();
      return {
        status: retryRes.status,
        data: retryData,
        intercepted402: true,
        paymentTx: txHash,
        amountXlm,
      };
    }

    const data = await initialRes.json();
    return {
      status: initialRes.status,
      data,
      intercepted402: false,
    };
  }

  /**
   * 7. Query live on-chain state from Soroban RPC (with fallback to cached testnet-proofs.json)
   */
  async getLiveOnChainStatus(deviceHashInput) {
    const proofs = loadTestnetProofs();
    const deviceHash = normalizeDeviceHash(
      deviceHashInput ||
        proofs?.deviceHash ||
        computeDeviceHashHex(TRUCK_POD_DEVICE_SERIAL)
    );

    try {
      const [owner, policy, escrowBalanceStroops] = await Promise.all([
        this.noir.getDeviceOwner(deviceHash),
        this.noir.getPolicy(deviceHash),
        this.noir.getEscrowBalance(deviceHash),
      ]);

      return {
        liveRpcConnected: true,
        contractSetKey: this.contractSetKey,
        contracts: this.noir.contracts,
        nativeAssetAddress: this.nativeAssetAddress,
        deviceHash,
        deviceOwner: owner,
        policy: policy
          ? {
              agent: policy.agent,
              maxAmountStroops: policy.maxAmount.toString(),
              maxAmountXlm: fromStroops(policy.maxAmount),
              asset: policy.asset,
              expiresAt: policy.expiresAt ? policy.expiresAt.toISOString() : null,
            }
          : null,
        escrowBalanceStroops: escrowBalanceStroops.toString(),
        escrowBalanceXlm: fromStroops(escrowBalanceStroops),
        proofs,
      };
    } catch (err) {
      return {
        liveRpcConnected: false,
        rpcError: err?.message || String(err),
        contractSetKey: this.contractSetKey,
        contracts: this.noir.contracts,
        nativeAssetAddress: this.nativeAssetAddress,
        deviceHash,
        proofs,
      };
    }
  }
}

export default NoirService;

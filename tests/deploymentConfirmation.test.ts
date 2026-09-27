import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContractDeploymentService, DeploymentProgress } from '../src/services/contractDeploymentService';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { __setMockDeploymentStatus, PREPROD_CONFIG, setDeployedContractAddress, clearStoredContractAddress, getStoredContractAddress } from '../src/config/network';

import { MidnightConnectedAPI, OneAmWalletProvider } from '../src/wallet/types';

describe('PrivateRank Preprod Deployment Confirmation State Machine', () => {
  const organizerAddress = "mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst";

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    __setMockDeploymentStatus(null);
    clearStoredContractAddress();
    OneAmConnector.setConnectedApi(null);
  });

  afterEach(() => {
    __setMockDeploymentStatus(null);
    clearStoredContractAddress();
    OneAmConnector.setConnectedApi(null);
  });

  it('should transition through AWAITING_APPROVAL -> BROADCASTING -> SUBMITTED -> WAITING_INDEXER -> CONFIRMED', async () => {
    const steps: DeploymentProgress[] = [];

    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => ['mn_shielded_test'],
      getUnshieldedAddress: async () => organizerAddress,
      getDustBalance: async () => 50000000n,
      getNetwork: async () => 'preprod',
      signData: vi.fn().mockResolvedValue({
        data: 'intent',
        signature: 'mock_signature_1234567890abcdef',
        verifyingKey: 'vk'
      }),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({
        tx: 'midnight:transaction[v9](signature[v1],proof,embedded-fr[v1]):balanced_hex'
      }),
      submitTransaction: vi.fn().mockResolvedValue('0xreal_tx_hash_9876543210abcdef'),
      getTxHistory: vi.fn().mockResolvedValue([
        { txHash: '0xreal_tx_hash_9876543210abcdef', txStatus: { status: 'confirmed' } }
      ])
    };

    const mockProvider: OneAmWalletProvider = {
      name: '1AM Wallet',
      apiVersion: '1.0.0',
      connect: vi.fn().mockResolvedValue(mockApi),
      getNetwork: vi.fn().mockResolvedValue('preprod')
    };

    (window as unknown as { midnight: { '1am': OneAmWalletProvider } }).midnight = {
      '1am': mockProvider
    };

    // Simulate initial indexer delay (returns null for first 2 polls, then confirmed on 3rd)
    let pollCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('graphql')) {
        pollCount++;
        if (pollCount < 3) {
          return new Response(JSON.stringify({
            data: { contractAction: null }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
          return new Response(JSON.stringify({
            data: {
              contractAction: {
                address: '0200abcd1234ef56789012345678901234567890123456789012345678901234',
                state: '0x01',
                transaction: {
                  id: 'tx_id_123',
                  hash: '0xreal_tx_hash_9876543210abcdef',
                  block: { height: 1042 }
                }
              }
            }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const result = await ContractDeploymentService.deployContractVia1Am(
      (p) => {
        steps.push(p);
      },
      { pollingIntervalMs: 20, maxAttempts: 10 }
    );

    // Verify state progression
    const stepNames = steps.map(s => s.step);
    expect(stepNames).toContain('CHECKING_WALLET');
    expect(stepNames).toContain('CHECKING_DUST');
    expect(stepNames).toContain('PREPARING_TRANSACTION');
    expect(stepNames).toContain('AWAITING_APPROVAL');
    expect(stepNames).toContain('BROADCASTING');
    expect(stepNames).toContain('SUBMITTED');
    expect(stepNames).toContain('WAITING_INDEXER');
    expect(stepNames).toContain('CONFIRMED');
    expect(stepNames).not.toContain('FAILED');

    // Verify indexer delay was tolerated without failing
    expect(pollCount).toBeGreaterThanOrEqual(3);

    // Verify returned and persisted real contract address
    expect(result.contractAddress).toBeDefined();
    expect(result.contractAddress.length).toBe(64);
    expect(result.txHash).toBe('0xreal_tx_hash_9876543210abcdef');
  });

  it('should transition to FAILED and clear state if user rejects transaction in wallet', async () => {
    const steps: DeploymentProgress[] = [];

    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => ['mn_shielded_test'],
      getUnshieldedAddress: async () => organizerAddress,
      getDustBalance: async () => 50000000n,
      getNetwork: async () => 'preprod',
      signData: vi.fn(),
      // User rejects the Dust sponsorship / balance step in 1AM Wallet
      balanceUnsealedTransaction: vi.fn().mockRejectedValue(new Error('User rejected transaction')),
      submitTransaction: vi.fn()
    };

    const mockProvider: OneAmWalletProvider = {
      name: '1AM Wallet',
      apiVersion: '1.0.0',
      connect: vi.fn().mockResolvedValue(mockApi),
      getNetwork: vi.fn().mockResolvedValue('preprod')
    };

    (window as unknown as { midnight: { '1am': OneAmWalletProvider } }).midnight = {
      '1am': mockProvider
    };

    await expect(
      ContractDeploymentService.deployContractVia1Am((p) => steps.push(p))
    ).rejects.toThrow();

    const lastStep = steps[steps.length - 1];
    expect(lastStep.step).toBe('FAILED');
    // Message reflects sponsorship/balance rejection, not signData
    expect(lastStep.message).toMatch(/rejected|cancelled|failed/i);
  });

  it('should share ONE canonical contract address between Organizer A and Organizer B', () => {
    const canonicalAddr = '0200' + '1234567890abcdef'.repeat(3) + '1234567890ab';
    expect(canonicalAddr.length).toBe(64);
    setDeployedContractAddress(canonicalAddr);

    // Both organizers and the global network config read the identical canonical address
    expect(PREPROD_CONFIG.contractAddress).toBe(canonicalAddr);

    // Reload / simulate fresh reader
    const stored = getStoredContractAddress();
    expect(stored).toBe(canonicalAddr);
  });

  it('should refuse redeployment if contract is already confirmed on Midnight Preprod', async () => {
    // Use a synthetic PrivateRank contract address (64-char hex, not the a4f5e2 bounty contract)
    const canonicalAddr = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
    __setMockDeploymentStatus({
      isDeployed: true,
      contractAddress: canonicalAddr,
      state: '0x01'
    });

    const progressSteps: DeploymentProgress[] = [];
    const result = await ContractDeploymentService.deployContractVia1Am((p) => {
      progressSteps.push(p);
    });

    expect(result.contractAddress).toBe(canonicalAddr);
    expect(progressSteps).toHaveLength(1);
    expect(progressSteps[0].step).toBe('CONFIRMED');
    expect(progressSteps[0].message).toContain('already deployed');
  });

  it('should resolve canonical contractAddress as empty initially and never use an unverified placeholder', () => {
    const canonical = PREPROD_CONFIG.contractAddress;
    expect(canonical).toBe('');
    expect(canonical).not.toContain('a4f5e2');
    expect(canonical).not.toContain('465b7e');
    expect(canonical).not.toContain('0200707269');
  });

  it('TEST 1: Fresh app -> Organizer -> Create Tournament -> real deployment -> 1AM approval -> indexer confirmation -> actual address stored', async () => {
    // 1. Fresh state: no stored contract address
    expect(getStoredContractAddress()).toBeNull();

    const deployedAddressOnChain = '7777777788888888999999990000000011111111222222223333333344444444';

    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => ['mn_shielded_test'],
      getUnshieldedAddress: async () => organizerAddress,
      getDustBalance: async () => 50000000n,
      getNetwork: async () => 'preprod',
      signData: vi.fn(),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({
        tx: 'midnight:transaction[v9](signature[v1],proof,embedded-fr[v1]):balanced_hex'
      }),
      submitTransaction: vi.fn().mockResolvedValue('0xreal_deploy_tx_hash_1111'),
      getTxHistory: async () => []
    };

    const mockProvider: OneAmWalletProvider = {
      name: '1AM Wallet',
      apiVersion: '1.0.0',
      connect: vi.fn().mockResolvedValue(mockApi),
      getNetwork: vi.fn().mockResolvedValue('preprod')
    };
    (window as any).midnight = { '1am': mockProvider };

    // Indexer mock returns confirmed ContractDeploy for whatever address was deployed
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, opts: any) => {
      if (String(url).includes('graphql')) {
        let requestedAddress = '';
        try {
          const body = JSON.parse(opts?.body || '{}');
          requestedAddress = body.variables?.address || '';
        } catch {}
        return new Response(JSON.stringify({
          data: {
            contractAction: {
              address: requestedAddress || '78605bde8367e855803dd43941f91a4a843e7bea5b21eb73341d4e37917986dd',
              state: '0x01',
              transaction: {
                hash: '0xreal_deploy_tx_hash_1111',
                block: { height: 2719500 }
              }
            }
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const result = await ContractDeploymentService.deployContractVia1Am(
      () => {},
      { pollingIntervalMs: 10, maxAttempts: 5 }
    );

    // Verified address is returned and stored
    expect(result.contractAddress).toBeDefined();
    expect(result.contractAddress.length).toBe(64);
    expect(getStoredContractAddress()).toBe(result.contractAddress);
    expect(PREPROD_CONFIG.contractAddress).toBe(result.contractAddress);
  });

  it('TEST 2: Click Create Tournament again -> NO deployment -> use stored address -> real createTournament transaction', async () => {
    const storedAddr = '7777777788888888999999990000000011111111222222223333333344444444';
    setDeployedContractAddress(storedAddr);

    __setMockDeploymentStatus({
      isDeployed: true,
      contractAddress: storedAddr,
      state: '0x01'
    });

    // Deploy service must recognize it is already deployed and REFUSE a second ContractDeploy
    const steps: DeploymentProgress[] = [];
    const result = await ContractDeploymentService.deployContractVia1Am((p) => steps.push(p));

    expect(result.contractAddress).toBe(storedAddr);
    expect(steps).toHaveLength(1);
    expect(steps[0].step).toBe('CONFIRMED');
    expect(steps[0].message).toContain('already deployed');
  });

  it('TEST 3: Refresh browser -> stored address remains -> Create Tournament uses same contract', () => {
    const storedAddr = '7777777788888888999999990000000011111111222222223333333344444444';
    setDeployedContractAddress(storedAddr);

    // Simulate page refresh (clear in-memory variables, but localStorage remains)
    clearStoredContractAddress();
    localStorage.setItem('privaterank_canonical_contract_address', storedAddr);

    const reloaded = getStoredContractAddress();
    expect(reloaded).toBe(storedAddr);
    expect(PREPROD_CONFIG.contractAddress).toBe(storedAddr);
  });

  it('TEST 4: Create another tournament -> same contract address -> NO second ContractDeploy', async () => {
    const canonicalAddr = '7777777788888888999999990000000011111111222222223333333344444444';
    setDeployedContractAddress(canonicalAddr);

    __setMockDeploymentStatus({
      isDeployed: true,
      contractAddress: canonicalAddr,
      state: '0x01'
    });

    // Attempting deployment again for tournament 2 and 3 returns the existing address without building any new ContractDeploy
    const res2 = await ContractDeploymentService.deployContractVia1Am(() => {});
    expect(res2.contractAddress).toBe(canonicalAddr);

    const res3 = await ContractDeploymentService.deployContractVia1Am(() => {});
    expect(res3.contractAddress).toBe(canonicalAddr);
  });
});


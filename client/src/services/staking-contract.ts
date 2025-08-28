import { Address, PublicClient, WalletClient } from 'viem';
import MultiPoolStakingAPRABI from './abis/MultiPoolStakingAPR.json';

// Contract address - this would be set after deployment
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface StakingPoolInfo {
  stakingToken: Address;
  rewardsToken: Address;
  aprBps: bigint;
  lockPeriod: bigint;
  totalSupply: bigint;
  lastUpdateTime: bigint;
  rewardPerTokenStored: bigint;
}

export interface StakingContractService {
  // Get pool information
  getPoolInfo(poolId: number): Promise<StakingPoolInfo>;
  
  // Get user balance in a pool
  balanceOf(poolId: number, account: Address): Promise<bigint>;
  
  // Get earned rewards for a user in a pool
  earned(poolId: number, account: Address): Promise<bigint>;
  
  // Get reward per token for a pool
  rewardPerToken(poolId: number): Promise<bigint>;
  
  // Stake tokens
  stake(poolId: number, amount: bigint): Promise<void>;
  
  // Withdraw staked tokens
  withdraw(poolId: number, amount: bigint): Promise<void>;
  
  // Early withdraw with penalty
  earlyWithdraw(poolId: number, amount: bigint): Promise<void>;
  
  // Claim rewards
  getReward(poolId: number): Promise<void>;
  
  // Exit (withdraw + claim rewards)
  exit(poolId: number): Promise<void>;
  
  // Emergency withdraw (forfeit rewards)
  emergencyWithdraw(poolId: number): Promise<void>;
}

export class ViemStakingContractService implements StakingContractService {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  
  constructor(publicClient: PublicClient, walletClient: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }
  
  async getPoolInfo(poolId: number): Promise<StakingPoolInfo> {
    const result = await this.publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'getPoolInfo',
      args: [BigInt(poolId)]
    }) as [Address, Address, bigint, bigint, bigint, bigint, bigint];
    
    return {
      stakingToken: result[0],
      rewardsToken: result[1],
      aprBps: result[2],
      lockPeriod: result[3],
      totalSupply: result[4],
      lastUpdateTime: result[5],
      rewardPerTokenStored: result[6]
    };
  }
  
  async balanceOf(poolId: number, account: Address): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'balanceOf',
      args: [BigInt(poolId), account]
    });
    return result as bigint;
  }
  
  async earned(poolId: number, account: Address): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'earned',
      args: [BigInt(poolId), account]
    });
    return result as bigint;
  }
  
  async rewardPerToken(poolId: number): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'rewardPerToken',
      args: [BigInt(poolId)]
    });
    return result as bigint;
  }
  
  async stake(poolId: number, amount: bigint): Promise<void> {
    const [account] = await this.walletClient.getAddresses();
    
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'stake',
      args: [BigInt(poolId), amount],
      account
    });
    
    await this.walletClient.writeContract(request);
  }
  
  async withdraw(poolId: number, amount: bigint): Promise<void> {
    const [account] = await this.walletClient.getAddresses();
    
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'withdraw',
      args: [BigInt(poolId), amount],
      account
    });
    
    await this.walletClient.writeContract(request);
  }
  
  async earlyWithdraw(poolId: number, amount: bigint): Promise<void> {
    const [account] = await this.walletClient.getAddresses();
    
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'earlyWithdraw',
      args: [BigInt(poolId), amount],
      account
    });
    
    await this.walletClient.writeContract(request);
  }
  
  async getReward(poolId: number): Promise<void> {
    const [account] = await this.walletClient.getAddresses();
    
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'getReward',
      args: [BigInt(poolId)],
      account
    });
    
    await this.walletClient.writeContract(request);
  }
  
  async exit(poolId: number): Promise<void> {
    const [account] = await this.walletClient.getAddresses();
    
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'exit',
      args: [BigInt(poolId)],
      account
    });
    
    await this.walletClient.writeContract(request);
  }
  
  async emergencyWithdraw(poolId: number): Promise<void> {
    const [account] = await this.walletClient.getAddresses();
    
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: MultiPoolStakingAPRABI,
      functionName: 'emergencyWithdraw',
      args: [BigInt(poolId)],
      account
    });
    
    await this.walletClient.writeContract(request);
  }
}

// Mock implementation for testing
export class MockStakingContractService implements StakingContractService {
  async getPoolInfo(poolId: number): Promise<StakingPoolInfo> {
    // Mock data for testing
    return {
      stakingToken: '0x0000000000000000000000000000000000000000',
      rewardsToken: '0x0000000000000000000000000000000000000000',
      aprBps: BigInt(1000), // 10%
      lockPeriod: BigInt(86400), // 1 day
      totalSupply: BigInt(1000000),
      lastUpdateTime: BigInt(Math.floor(Date.now() / 1000)),
      rewardPerTokenStored: BigInt(0)
    };
  }
  
  async balanceOf(poolId: number, account: Address): Promise<bigint> {
    return BigInt(1000);
  }
  
  async earned(poolId: number, account: Address): Promise<bigint> {
    return BigInt(50);
  }
  
  async rewardPerToken(poolId: number): Promise<bigint> {
    return BigInt("1000000000000000000"); // 1e18
  }
  
  async stake(poolId: number, amount: bigint): Promise<void> {
    console.log(`Staking ${amount} tokens in pool ${poolId}`);
  }
  
  async withdraw(poolId: number, amount: bigint): Promise<void> {
    console.log(`Withdrawing ${amount} tokens from pool ${poolId}`);
  }
  
  async earlyWithdraw(poolId: number, amount: bigint): Promise<void> {
    console.log(`Early withdrawing ${amount} tokens from pool ${poolId}`);
  }
  
  async getReward(poolId: number): Promise<void> {
    console.log(`Claiming rewards from pool ${poolId}`);
  }
  
  async exit(poolId: number): Promise<void> {
    console.log(`Exiting pool ${poolId}`);
  }
  
  async emergencyWithdraw(poolId: number): Promise<void> {
    console.log(`Emergency withdrawing from pool ${poolId}`);
  }
}
import { useEffect, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { ViemStakingContractService, StakingContractService } from '@/services/staking-contract';

export const useStakingContract = () => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [stakingService, setStakingService] = useState<StakingContractService | null>(null);

  useEffect(() => {
    // Create the staking service when clients are available
    if (publicClient || walletClient) {
      const service = new ViemStakingContractService(publicClient || null, walletClient || null);
      setStakingService(service);
    }
  }, [publicClient, walletClient]);

  return stakingService;
};
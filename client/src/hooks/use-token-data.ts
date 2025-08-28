import { useQuery } from "@tanstack/react-query";
import type { TokenData, Transaction, Holder, NetworkStatus, PriceHistory } from "@shared/schema";

export function useTokenData(contractAddress: string) {
  return useQuery<TokenData>({
    queryKey: ["/api/token", contractAddress],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    enabled: !!contractAddress,
    retry: false,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

export function useTransactions(contractAddress: string) {
  return useQuery<Transaction[]>({
    queryKey: ["/api/transactions", contractAddress],
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    enabled: !!contractAddress,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useTopHolders(contractAddress: string) {
  return useQuery<Holder[]>({
    queryKey: ["/api/holders", contractAddress],
    refetchInterval: 60000, // Refresh every minute
    enabled: !!contractAddress,
    retry: false,
    staleTime: 120000,
  });
}

export function useNetworkStatus() {
  return useQuery<NetworkStatus>({
    queryKey: ["/api/network-status"],
    refetchInterval: 1 * 60 * 1000, // Refresh every 1 minute
    retry: false,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

export function usePriceHistory(contractAddress: string, timeframe: string = "1D") {
  return useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history", contractAddress, timeframe],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    enabled: !!contractAddress,
    retry: false,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

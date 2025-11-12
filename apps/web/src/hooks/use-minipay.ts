import { useCallback, useEffect, useState } from "react";

type EthereumProviderRequest = {
  method: string;
};

type EthereumProvider = {
  isMiniPay?: boolean;
  request?: (args: EthereumProviderRequest) => Promise<unknown>;
};

type MiniPayWindow = Window & {
  ethereum?: EthereumProvider;
};

type MiniPayState = {
  isMiniPay: boolean;
  isReady: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

export function useMiniPay(): MiniPayState {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { ethereum } = window as MiniPayWindow;
    if (!ethereum) {
      setIsReady(true);
      return;
    }

    const detectMiniPay = async () => {
      try {
        const providerInfo = (await ethereum.request?.({
          method: "wallet_getProviderInfo",
        })) as { name?: string } | undefined;

        if (ethereum.isMiniPay || providerInfo?.name === "MiniPay") {
          setIsMiniPay(true);
        }
      } catch (err) {
        console.warn("Unable to detect MiniPay provider", err);
      } finally {
        setIsReady(true);
      }
    };

    detectMiniPay();
  }, []);

  const connect = useCallback(async () => {
    const { ethereum } = window as MiniPayWindow;
    if (!ethereum) {
      setError("No injected wallet detected.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await ethereum.request?.({
        method: "eth_requestAccounts",
      })) as string[] | undefined;

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect MiniPay wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return {
    isMiniPay,
    isReady,
    address,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}


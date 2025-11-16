"use client";

import { ConnectButton as RainbowKitConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

type MiniPayWindow = Window & {
  ethereum?: {
    isMiniPay?: boolean;
  };
};

export function ConnectButton() {
  const [isMinipay, setIsMinipay] = useState(false);

  useEffect(() => {
    const { ethereum } = window as MiniPayWindow;
    if (ethereum?.isMiniPay) {
      setIsMinipay(true);
    }
  }, []);

  if (isMinipay) {
    return null;
  }

  return <RainbowKitConnectButton showBalance={false} />;
}

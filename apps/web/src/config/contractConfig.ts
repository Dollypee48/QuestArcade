export const CONTRACT_ADDRESSES = {
  questArcade:
    process.env.NEXT_PUBLIC_QUEST_ARCADE_CONTRACT ??
    "0x9d9e0310b65DE1c4e5b25Fa665d24d11787f0e8a",
  questRegistry: process.env.NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT ?? "",
  rewardsVault: process.env.NEXT_PUBLIC_REWARDS_VAULT_CONTRACT ?? "",
  reputation: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT ?? "",
};

export const CHAIN_CONFIG = {
  defaultChainId: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID ?? 11142220),
  stableTokenAddress:
    process.env.NEXT_PUBLIC_STABLE_TOKEN_ADDRESS ??
    "0x7e6a38d86e4a655086218c1648999e509b40e391",
};

export const IPFS_CONFIG = {
  gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/",
  uploadEndpoint: process.env.NEXT_PUBLIC_IPFS_UPLOAD_ENDPOINT ?? "",
};

export const QUEST_LEVELS = [
  { name: "Rookie", minXp: 0 },
  { name: "Bronze", minXp: 500 },
  { name: "Silver", minXp: 1500 },
  { name: "Gold", minXp: 3500 },
  { name: "Platinum", minXp: 7000 },
  { name: "Mythic", minXp: 12000 },
];


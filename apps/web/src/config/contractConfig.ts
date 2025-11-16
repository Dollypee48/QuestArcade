type ContractAddresses = {
  questArcade: string;
  questRegistry: string;
  rewardsVault: string;
  reputation: string;
  stableTokenAddress?: string;
};

const KNOWN_CONTRACTS: Record<number, ContractAddresses> = {
  31337: {
    questArcade: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    questRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    rewardsVault: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    reputation: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  },
  11142220: {
    // Celo Sepolia Testnet
    questArcade: "0x9d9e0310b65DE1c4e5b25Fa665d24d11787f0e8a",
    questRegistry: "0x3a2936F64786a1CE11827427fdFc7c5786Bd47F3",
    rewardsVault: "0x5bb3B0A126ecB3067c2a7899B7e74a2C12c73695",
    reputation: "0xEd264879bDB23954475386C5279A4b09da393096",
    // IMPORTANT: The QuestArcade contract must be deployed with a valid ERC20 token address
    // Using MockERC20 which is already deployed and supports minting for testing
    // MockERC20 address: 0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708
    // NOTE: If you've already deployed QuestArcade with a different token, you need to redeploy
    stableTokenAddress: "0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708", // MockERC20 - supports minting
  },
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID ?? 31337);
const FALLBACK_CONTRACTS =
  KNOWN_CONTRACTS[DEFAULT_CHAIN_ID] ?? KNOWN_CONTRACTS[31337];

export const CONTRACT_ADDRESSES = {
  questArcade:
    process.env.NEXT_PUBLIC_QUEST_ARCADE_CONTRACT ?? FALLBACK_CONTRACTS.questArcade,
  questRegistry:
    process.env.NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT ?? FALLBACK_CONTRACTS.questRegistry,
  rewardsVault:
    process.env.NEXT_PUBLIC_REWARDS_VAULT_CONTRACT ?? FALLBACK_CONTRACTS.rewardsVault,
  reputation:
    process.env.NEXT_PUBLIC_REPUTATION_CONTRACT ?? FALLBACK_CONTRACTS.reputation,
};

export const CHAIN_CONFIG = {
  defaultChainId: DEFAULT_CHAIN_ID,
  stableTokenAddress:
    process.env.NEXT_PUBLIC_STABLE_TOKEN_ADDRESS ??
    FALLBACK_CONTRACTS.stableTokenAddress ??
    ZERO_ADDRESS,
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
  { name: "Legendary", minXp: 5000 },
  { name: "Platinum", minXp: 7000 },
  { name: "Mythic", minXp: 12000 },
];


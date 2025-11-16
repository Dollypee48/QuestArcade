import hre from "hardhat";
import { parseUnits, getAddress } from "viem";

async function main() {
  const tokenAddress = process.env.MINT_TOKEN_ADDRESS || "0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708";
  const recipientEnv = process.env.MINT_TO || process.env.DEFAULT_RECIPIENT;

  if (!recipientEnv) {
    throw new Error("Set MINT_TO environment variable to the recipient address.");
  }
  const recipient = getAddress(recipientEnv);

  const amountStr = process.env.MINT_AMOUNT || "1000";
  const amount = parseUnits(amountStr, 18);

  const [deployer] = await hre.viem.getWalletClients();
  const token = await hre.viem.getContractAt("MockERC20", tokenAddress, {
    client: deployer,
  });

  console.log(`Minting ${amountStr} tokens (${amount}) to ${recipient} from token ${tokenAddress}`);

  const hash = await token.write.mint([recipient, amount], {
    account: deployer.account.address,
  });
  console.log("Mint tx hash:", hash);

  const publicClient = await hre.viem.getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Minted successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

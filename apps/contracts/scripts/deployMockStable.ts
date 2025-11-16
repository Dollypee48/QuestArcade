import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const creator = getAddress("0x7e6a38d86e4a655086218c1648999e509b40e391");

  console.log("Deploying MockERC20 from:", deployer.account.address);

  const mockToken = await hre.viem.deployContract("MockERC20", ["Mock cUSD", "mcUSD", 18n]);
  console.log("Mock token deployed to:", mockToken.address);

  const mintAmount = 500n * 10n ** 18n;
  console.log(`Minting ${mintAmount} wei units to ${creator}`);

  const hash = await mockToken.write.mint([creator, mintAmount], { account: deployer.account });
  console.log("Mint transaction hash:", hash);

  console.log("Minted successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


import hre from "hardhat";

async function main() {
  const creator = "0x7e6a38d86e4a655086218c1648999e509b40e391";
  const questArcadeAddress = "0x9d9e0310b65DE1c4e5b25Fa665d24d11787f0e8a";

  const [owner] = await hre.viem.getWalletClients();

  console.log("Using owner wallet:", owner.account.address);
  const questArcade = await hre.viem.getContractAt("QuestArcade", questArcadeAddress, {
    client: { wallet: owner },
  });

  console.log(`Setting creator status for ${creator}…`);
  const hash = await questArcade.write.setCreatorStatus([creator, true]);
  console.log("Transaction hash:", hash);

  console.log("Creator approved successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


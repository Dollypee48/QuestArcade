import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("QuestRegistry", function () {
  async function deployFixture() {
    const [owner, questArcade, creator, other] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const questRegistry = await hre.viem.deployContract("QuestRegistry");

    return {
      owner,
      questArcade,
      creator,
      other,
      questRegistry,
      publicClient,
    };
  }

  it("allows the owner to set the QuestArcade address", async function () {
    const { questRegistry, owner, questArcade, publicClient } = await loadFixture(deployFixture);

    const questRegistryAsOwner = await hre.viem.getContractAt("QuestRegistry", questRegistry.address, {
      client: { wallet: owner },
    });

    const txHash = await questRegistryAsOwner.write.setQuestArcade([questArcade.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    const updatedQuestArcade = await questRegistry.read.questArcade();
    expect(updatedQuestArcade.toLowerCase()).to.equal(questArcade.account.address.toLowerCase());
  });

  it("registers and updates quest metadata via QuestArcade", async function () {
    const deployed = await loadFixture(deployFixture);
    const { questRegistry, owner, questArcade, creator, publicClient } = deployed;

    const questRegistryAsOwner = await hre.viem.getContractAt("QuestRegistry", questRegistry.address, {
      client: { wallet: owner },
    });
    const questRegistryAsQuestArcade = await hre.viem.getContractAt("QuestRegistry", questRegistry.address, {
      client: { wallet: questArcade },
    });

    const setHash = await questRegistryAsOwner.write.setQuestArcade([questArcade.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: setHash });

    const registerHash = await questRegistryAsQuestArcade.write.registerQuest([
      1n,
      creator.account.address,
      "Community Onboarding",
      "Onboard 10 merchants to MiniPay",
      "ipfs://quest-metadata",
      BigInt(Math.floor(Date.now() / 1000) + 86_400),
      1_000n,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: registerHash });

    const quest = await questRegistry.read.getQuest([1n]);
    expect(quest.exists).to.equal(true);
    expect(quest.creator.toLowerCase()).to.equal(creator.account.address.toLowerCase());
    expect(quest.rewardAmount).to.equal(1_000n);

    const updateMetadataHash = await questRegistryAsQuestArcade.write.updateQuestMetadata([
      1n,
      "ipfs://quest-updated",
      BigInt(Math.floor(Date.now() / 1000) + 172_800),
      1_500n,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: updateMetadataHash });

    const updateStateHash = await questRegistryAsQuestArcade.write.updateQuestState([1n, 3n]);
    await publicClient.waitForTransactionReceipt({ hash: updateStateHash });

    const updatedQuest = await questRegistry.read.getQuest([1n]);
    expect(updatedQuest.rewardAmount).to.equal(1_500n);
    expect(Number(updatedQuest.state)).to.equal(3);
    expect(updatedQuest.metadataURI).to.equal("ipfs://quest-updated");
  });

  it("reverts when unauthorized account attempts to register quest", async function () {
    const deployed = await loadFixture(deployFixture);
    const { questRegistry, other } = deployed;

    const questRegistryAsOther = await hre.viem.getContractAt("QuestRegistry", questRegistry.address, {
      client: { wallet: other },
    });

    await expect(
      questRegistryAsOther.write.registerQuest([
        99n,
        other.account.address,
        "Unauthorized quest",
        "Should fail",
        "ipfs://",
        BigInt(Math.floor(Date.now() / 1000) + 1_000),
        100n,
      ])
    ).to.be.rejectedWith("QuestRegistry__Unauthorized");
  });
});



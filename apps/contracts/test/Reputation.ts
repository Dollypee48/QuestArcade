import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Reputation", function () {
  async function deployFixture() {
    const [owner, questArcade, reporter, user] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const reputation = await hre.viem.deployContract("Reputation");

    return { owner, questArcade, reporter, user, reputation, publicClient };
  }

  it("allows QuestArcade to increment xp and reputation", async function () {
    const deployed = await loadFixture(deployFixture);
    const { owner, questArcade, user, reputation, publicClient } = deployed;

    const reputationAsOwner = await hre.viem.getContractAt("Reputation", reputation.address, {
      client: { wallet: owner },
    });
    const reputationAsQuestArcade = await hre.viem.getContractAt("Reputation", reputation.address, {
      client: { wallet: questArcade },
    });

    const setHash = await reputationAsOwner.write.setQuestArcade([questArcade.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: setHash });

    const increaseHash = await reputationAsQuestArcade.write.increaseReputation([
      user.account.address,
      250n,
      10n,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: increaseHash });

    const [profile, level] = await reputation.read.getProfile([user.account.address]);
    expect(profile.xp).to.equal(250n);
    expect(profile.reputation).to.equal(10n);
    expect(level).to.equal("Bronze");
  });

  it("authorizes external reporters", async function () {
    const deployed = await loadFixture(deployFixture);
    const { owner, reporter, user, reputation, publicClient } = deployed;

    const reputationAsOwner = await hre.viem.getContractAt("Reputation", reputation.address, {
      client: { wallet: owner },
    });
    const reputationAsReporter = await hre.viem.getContractAt("Reputation", reputation.address, {
      client: { wallet: reporter },
    });

    const setReporterHash = await reputationAsOwner.write.setReporter([reporter.account.address, true]);
    await publicClient.waitForTransactionReceipt({ hash: setReporterHash });

    const increaseHash = await reputationAsReporter.write.increaseReputation([user.account.address, 100n, 5n]);
    await publicClient.waitForTransactionReceipt({ hash: increaseHash });

    const [profile, level] = await reputation.read.getProfile([user.account.address]);
    expect(profile.xp).to.equal(100n);
    expect(profile.reputation).to.equal(5n);
    expect(level).to.equal("Rookie");
  });

  it("reverts when an unauthorized caller tries to update reputation", async function () {
    const deployed = await loadFixture(deployFixture);
    const { reporter, user, reputation } = deployed;

    const reputationAsReporter = await hre.viem.getContractAt("Reputation", reputation.address, {
      client: { wallet: reporter },
    });

    await expect(
      reputationAsReporter.write.increaseReputation([user.account.address, 10n, 1n])
    ).to.be.rejectedWith("Reputation__Unauthorized");
  });
});



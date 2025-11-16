import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("RewardsVault", function () {
  async function deployFixture() {
    const [owner, questArcade, creator, worker] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const rewardsVault = await hre.viem.deployContract("RewardsVault");
    const stableToken = await hre.viem.deployContract("MockERC20", ["Mock cUSD", "mcUSD", 18n]);

    return {
      owner,
      questArcade,
      creator,
      worker,
      publicClient,
      rewardsVault,
      stableToken,
    };
  }

  it("escrows quest funds and releases them to the worker", async function () {
    const deployed = await loadFixture(deployFixture);
    const { rewardsVault, stableToken, owner, questArcade, creator, worker, publicClient } = deployed;

    const rewardsVaultAsOwner = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: owner },
    });
    const rewardsVaultAsQuestArcade = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: questArcade },
    });
    const tokenAsCreator = await hre.viem.getContractAt("MockERC20", stableToken.address, {
      client: { wallet: creator },
    });

    const amount = parseEther("100");

    const mintHash = await stableToken.write.mint([creator.account.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: mintHash });

    const approveHash = await tokenAsCreator.write.approve([rewardsVault.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const fundHash = await rewardsVaultAsOwner.write.setQuestArcade([questArcade.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: fundHash });

    const vaultAsCreator = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: creator },
    });
    const escrowHash = await vaultAsCreator.write.fundQuest([1n, stableToken.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: escrowHash });

    const escrow = await rewardsVault.read.getEscrow([1n]);
    expect(escrow.exists).to.equal(true);
    expect(escrow.amount).to.equal(amount);
    expect(escrow.creator.toLowerCase()).to.equal(creator.account.address.toLowerCase());

    const releaseHash = await rewardsVaultAsQuestArcade.write.releaseReward([1n, worker.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: releaseHash });

    const workerBalance = await stableToken.read.balanceOf([worker.account.address]);
    expect(workerBalance).to.equal(amount);
  });

  it("allows QuestArcade to refund escrowed funds", async function () {
    const deployed = await loadFixture(deployFixture);
    const { rewardsVault, stableToken, owner, questArcade, creator, publicClient } = deployed;

    const rewardsVaultAsOwner = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: owner },
    });
    const rewardsVaultAsQuestArcade = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: questArcade },
    });
    const tokenAsCreator = await hre.viem.getContractAt("MockERC20", stableToken.address, {
      client: { wallet: creator },
    });

    const amount = parseEther("50");

    const mintHash = await stableToken.write.mint([creator.account.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: mintHash });

    const approveHash = await tokenAsCreator.write.approve([rewardsVault.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const setHash = await rewardsVaultAsOwner.write.setQuestArcade([questArcade.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: setHash });

    const vaultAsCreator = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: creator },
    });

    const escrowHash = await vaultAsCreator.write.fundQuest([2n, stableToken.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: escrowHash });

    const refundHash = await rewardsVaultAsQuestArcade.write.refundCreator([2n]);
    await publicClient.waitForTransactionReceipt({ hash: refundHash });

    const creatorBalance = await stableToken.read.balanceOf([creator.account.address]);
    expect(creatorBalance).to.equal(amount);
  });

  it("prevents releasing or refunding twice", async function () {
    const deployed = await loadFixture(deployFixture);
    const { rewardsVault, stableToken, owner, questArcade, creator, worker, publicClient } = deployed;

    const rewardsVaultAsOwner = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: owner },
    });
    const rewardsVaultAsQuestArcade = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: questArcade },
    });
    const tokenAsCreator = await hre.viem.getContractAt("MockERC20", stableToken.address, {
      client: { wallet: creator },
    });

    const amount = parseEther("25");

    const mintHash = await stableToken.write.mint([creator.account.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: mintHash });

    const approveHash = await tokenAsCreator.write.approve([rewardsVault.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const setHash = await rewardsVaultAsOwner.write.setQuestArcade([questArcade.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: setHash });

    const vaultAsCreator = await hre.viem.getContractAt("RewardsVault", rewardsVault.address, {
      client: { wallet: creator },
    });
    const escrowHash = await vaultAsCreator.write.fundQuest([3n, stableToken.address, amount]);
    await publicClient.waitForTransactionReceipt({ hash: escrowHash });

    const releaseHash = await rewardsVaultAsQuestArcade.write.releaseReward([3n, worker.account.address]);
    await publicClient.waitForTransactionReceipt({ hash: releaseHash });

    await expect(
      rewardsVaultAsQuestArcade.write.releaseReward([3n, worker.account.address])
    ).to.be.rejectedWith("RewardsVault__NothingToRelease");

    await expect(rewardsVaultAsQuestArcade.write.refundCreator([3n])).to.be.rejectedWith(
      "RewardsVault__NothingToRefund"
    );
  });
});



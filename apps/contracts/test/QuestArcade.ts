import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("QuestArcade", function () {
  async function deployQuestArcadeFixture() {
    const [owner, creator, worker, feeRecipient, other] =
      await hre.viem.getWalletClients();

    const stableToken = await hre.viem.deployContract("MockERC20", [
      "Mock cUSD",
      "mcUSD",
      18n,
    ]);

    const platformFeeBps = 500n; // 5%
    const questArcade = await hre.viem.deployContract("QuestArcade", [
      stableToken.address,
      feeRecipient.account.address,
      platformFeeBps,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      owner,
      creator,
      worker,
      feeRecipient,
      other,
      stableToken,
      questArcade,
      publicClient,
      platformFeeBps,
    };
  }

  async function prepareQuest({
    questArcade,
    stableToken,
    creator,
    publicClient,
    rewardAmount = parseEther("100"),
    verificationType = 0,
    deadlineOffset = 7 * 24 * 60 * 60,
  }: Awaited<ReturnType<typeof deployQuestArcadeFixture>> & {
    rewardAmount?: bigint;
    verificationType?: number;
    deadlineOffset?: number;
  }) {
    const now = await time.latest();
    const deadline = BigInt(now + deadlineOffset);

    await stableToken.write.mint([creator.account.address, rewardAmount]);

    const stableTokenAsCreator = await hre.viem.getContractAt(
      "MockERC20",
      stableToken.address,
      { client: { wallet: creator } }
    );
    const approveHash = await stableTokenAsCreator.write.approve([
      questArcade.address,
      rewardAmount,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const approvalHash = await questArcade.write.setCreatorStatus([
      creator.account.address,
      true,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });

    const questArcadeAsCreator = await hre.viem.getContractAt(
      "QuestArcade",
      questArcade.address,
      { client: { wallet: creator } }
    );
    const createHash = await questArcadeAsCreator.write.createQuest([
      "Capture the Flag",
      "Complete the on-chain bounty",
      rewardAmount,
      verificationType,
      deadline,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: createHash });

    return {
      questId: 1n,
      rewardAmount,
      deadline,
      questArcadeAsCreator,
    };
  }

  describe("Quest creation", function () {
    it("escrows rewards and stores quest metadata for approved creators", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, stableToken, creator, publicClient } = deployed;

      const { questId, rewardAmount } = await prepareQuest(deployed);

      const quest = await questArcade.read.getQuestDetails([questId]);
      expect(quest.id).to.equal(questId);
      expect(quest.creator).to.equal(getAddress(creator.account.address));
      expect(quest.rewardAmount).to.equal(rewardAmount);
      expect(Number(quest.status)).to.equal(0); // QuestStatus.Open
      expect(quest.rewardEscrowed).to.equal(true);

      const contractBalance = await stableToken.read.balanceOf([
        questArcade.address,
      ]);
      expect(contractBalance).to.equal(rewardAmount);
    });
  });

  describe("Quest lifecycle", function () {
    it("lets a worker complete a quest and claim rewards after verification", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const {
        questArcade,
        stableToken,
        creator,
        worker,
        feeRecipient,
        publicClient,
        platformFeeBps,
      } = deployed;

      const { questId, rewardAmount, questArcadeAsCreator } =
        await prepareQuest(deployed);

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );

      const acceptHash = await questArcadeAsWorker.write.acceptQuest([
        questId,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: acceptHash });

      const submitHash = await questArcadeAsWorker.write.submitProof([
        questId,
        "bafyproofcid",
        "bafymetadatacid",
      ]);
      await publicClient.waitForTransactionReceipt({ hash: submitHash });

      const verifyHash = await questArcadeAsCreator.write.verifyQuest([
        questId,
        true,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: verifyHash });

      let quest = await questArcade.read.getQuestDetails([questId]);
      expect(Number(quest.status)).to.equal(3); // QuestStatus.Verified
      expect(quest.rewardClaimed).to.equal(false);
      expect(quest.rewardEscrowed).to.equal(true);
      expect(quest.worker).to.equal(getAddress(worker.account.address));

      let workerBalance = await stableToken.read.balanceOf([
        worker.account.address,
      ]);
      let feeRecipientBalance = await stableToken.read.balanceOf([
        feeRecipient.account.address,
      ]);
      expect(workerBalance).to.equal(0n);
      expect(feeRecipientBalance).to.equal(0n);

      const claimHash = await questArcadeAsWorker.write.claimReward([questId]);
      await publicClient.waitForTransactionReceipt({ hash: claimHash });

      quest = await questArcade.read.getQuestDetails([questId]);
      expect(quest.rewardClaimed).to.equal(true);
      expect(quest.rewardEscrowed).to.equal(false);

      const fee = (rewardAmount * platformFeeBps) / 10_000n;
      const workerPayout = rewardAmount - fee;

      workerBalance = await stableToken.read.balanceOf([
        worker.account.address,
      ]);
      feeRecipientBalance = await stableToken.read.balanceOf([
        feeRecipient.account.address,
      ]);
      expect(workerBalance).to.equal(workerPayout);
      expect(feeRecipientBalance).to.equal(fee);

      const profile = await questArcade.read.getUserReputation([
        worker.account.address,
      ]);
      expect(profile.xp).to.equal(100n);
      expect(profile.reputation).to.equal(workerPayout / 10n ** 18n);
      expect(profile.level).to.equal("Rookie");

      await expect(
        questArcadeAsWorker.write.claimReward([questId])
      ).to.be.rejectedWith("QuestArcade__RewardAlreadyClaimed");
    });

    it("refunds rewards to the creator when a quest is rejected", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, stableToken, creator, worker, publicClient } =
        deployed;

      const { questId, rewardAmount, questArcadeAsCreator } =
        await prepareQuest(deployed);

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );

      const acceptHash = await questArcadeAsWorker.write.acceptQuest([
        questId,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: acceptHash });

      const submitHash = await questArcadeAsWorker.write.submitProof([
        questId,
        "bafyproofcid",
        "bafymetadatacid",
      ]);
      await publicClient.waitForTransactionReceipt({ hash: submitHash });

      const verifyHash = await questArcadeAsCreator.write.verifyQuest([
        questId,
        false,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: verifyHash });

      const quest = await questArcade.read.getQuestDetails([questId]);
      expect(Number(quest.status)).to.equal(4); // QuestStatus.Rejected
      expect(quest.rewardClaimed).to.equal(false);
      expect(quest.rewardEscrowed).to.equal(false);

      const contractBalance = await stableToken.read.balanceOf([
        questArcade.address,
      ]);
      expect(contractBalance).to.equal(0n);

      const creatorBalance = await stableToken.read.balanceOf([
        creator.account.address,
      ]);
      expect(creatorBalance).to.equal(rewardAmount);
    });
    it("prevents claiming rewards before verification", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, worker, publicClient } = deployed;

      const { questId } = await prepareQuest(deployed);

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );

      const acceptHash = await questArcadeAsWorker.write.acceptQuest([questId]);
      await publicClient.waitForTransactionReceipt({ hash: acceptHash });

      await expect(
        questArcadeAsWorker.write.claimReward([questId])
      ).to.be.rejectedWith("QuestArcade__InvalidStatusTransition");
    });

    it("blocks non-creators and non-owners from verifying quests", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, worker, other, publicClient } = deployed;

      const { questId } = await prepareQuest(deployed);

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );
      const acceptHash = await questArcadeAsWorker.write.acceptQuest([questId]);
      await publicClient.waitForTransactionReceipt({ hash: acceptHash });
      const submitHash = await questArcadeAsWorker.write.submitProof([
        questId,
        "cid",
        "meta",
      ]);
      await publicClient.waitForTransactionReceipt({ hash: submitHash });

      const questArcadeAsOther = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: other } }
      );

      await expect(
        questArcadeAsOther.write.verifyQuest([questId, true])
      ).to.be.rejectedWith("QuestArcade__Unauthorized");
    });

    it("reverts when quest acceptance happens after the deadline", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, worker } = deployed;

      const { questId, deadline } = await prepareQuest({
        ...deployed,
        deadlineOffset: 3600,
      });

      await time.increaseTo(deadline + 1n);

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );

      await expect(
        questArcadeAsWorker.write.acceptQuest([questId])
      ).to.be.rejectedWith("QuestArcade__DeadlineElapsed");
    });

    it("prevents quest creator from accepting their own quest", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, creator } = deployed;

      const { questId, questArcadeAsCreator } = await prepareQuest(deployed);

      await expect(
        questArcadeAsCreator.write.acceptQuest([questId])
      ).to.be.rejectedWith("QuestArcade__Unauthorized");
    });

    it("disallows proof submission from non-assigned workers", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, worker, other, publicClient } = deployed;

      const { questId } = await prepareQuest(deployed);

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );
      const acceptHash = await questArcadeAsWorker.write.acceptQuest([questId]);
      await publicClient.waitForTransactionReceipt({ hash: acceptHash });

      const questArcadeAsOther = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: other } }
      );

      await expect(
        questArcadeAsOther.write.submitProof([
          questId,
          "cid",
          "meta",
        ])
      ).to.be.rejectedWith("QuestArcade__WorkerOnly");
    });

    it("reverts proof submission after the deadline", async function () {
      const deployed = await loadFixture(deployQuestArcadeFixture);
      const { questArcade, worker, publicClient } = deployed;

      const { questId, deadline } = await prepareQuest({
        ...deployed,
        deadlineOffset: 3600,
      });

      const questArcadeAsWorker = await hre.viem.getContractAt(
        "QuestArcade",
        questArcade.address,
        { client: { wallet: worker } }
      );
      const acceptHash = await questArcadeAsWorker.write.acceptQuest([questId]);
      await publicClient.waitForTransactionReceipt({ hash: acceptHash });

      await time.increaseTo(deadline + 1n);

      await expect(
        questArcadeAsWorker.write.submitProof([
          questId,
          "cid",
          "meta",
        ])
      ).to.be.rejectedWith("QuestArcade__DeadlineElapsed");
    });
  });
});


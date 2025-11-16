// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/ICUSD.sol";

/**
 * @title QuestArcade
 * @notice Core smart contract powering the QuestArcade Play-to-Earn platform on Celo.
 *         Handles quest lifecycle management, cUSD escrow, reward settlement, and
 *         on-chain reputation tracking for participants.
 */
contract QuestArcade is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum VerificationType {
        Photo,
        Video,
        GPS
    }

    enum QuestStatus {
        Open,
        Accepted,
        Submitted,
        Verified,
        Rejected,
        Cancelled
    }

    struct Quest {
        uint256 id;
        string title;
        string description;
        uint256 rewardAmount;
        VerificationType verificationType;
        uint64 deadline;
        address creator;
        address worker;
        QuestStatus status;
        string proofCID;
        string proofMetadata;
        bool exists;
        bool rewardEscrowed;
        bool rewardClaimed;
    }

    struct ReputationProfile {
        uint256 xp;
        uint256 reputation;
        string level;
    }

    uint256 private constant MAX_FEE_BPS = 1000; // 10%
    uint256 private constant FEE_DENOMINATOR = 10_000;

    ICUSD public immutable stableToken;
    address public feeRecipient;
    uint256 public platformFeeBps;
    uint256 public questCounter;

    mapping(uint256 => Quest) private quests;
    mapping(address => bool) public approvedCreators;
    mapping(address => uint256[]) private userQuestIds;
    mapping(address => uint256[]) private creatorQuestIds;
    mapping(address => uint256) public userReputation;
    mapping(address => uint256) public userXp;

    event QuestCreated(uint256 indexed questId, address indexed creator, uint256 rewardAmount);
    event QuestUpdated(uint256 indexed questId);
    event QuestCancelled(uint256 indexed questId);
    event QuestAccepted(uint256 indexed questId, address indexed user);
    event QuestSubmitted(uint256 indexed questId, address indexed user, string proofCID);
    event QuestCompleted(uint256 indexed questId, address indexed user, QuestStatus status);
    event RewardClaimed(uint256 indexed questId, address indexed user, uint256 amount);
    event ReputationUpdated(address indexed user, uint256 newReputation, uint256 newXp, string newLevel);
    event CreatorStatusUpdated(address indexed creator, bool isApproved);
    event PlatformFeeUpdated(uint256 feeBps, address indexed feeRecipient);

    error QuestArcade__CreatorNotApproved();
    error QuestArcade__InvalidFeeBps();
    error QuestArcade__InvalidQuest();
    error QuestArcade__InvalidStatusTransition();
    error QuestArcade__DeadlineElapsed();
    error QuestArcade__RewardAlreadyClaimed();
    error QuestArcade__Unauthorized();
    error QuestArcade__WorkerOnly();
    error QuestArcade__CreatorOnly();
    error QuestArcade__QuestAlreadyAccepted();
    error QuestArcade__InvalidVerificationType();
    error QuestArcade__FundsNotEscrowed();

    modifier questExists(uint256 questId) {
        if (!quests[questId].exists) revert QuestArcade__InvalidQuest();
        _;
    }

    modifier onlyQuestCreator(uint256 questId) {
        if (quests[questId].creator != msg.sender) revert QuestArcade__CreatorOnly();
        _;
    }

    modifier onlyQuestWorker(uint256 questId) {
        if (quests[questId].worker != msg.sender) revert QuestArcade__WorkerOnly();
        _;
    }

    constructor(ICUSD _stableToken, address _feeRecipient, uint256 _platformFeeBps)
        Ownable(msg.sender)
    {
        if (address(_stableToken) == address(0)) revert QuestArcade__InvalidQuest();
        if (_platformFeeBps > MAX_FEE_BPS) revert QuestArcade__InvalidFeeBps();

        stableToken = _stableToken;
        feeRecipient = _feeRecipient;
        platformFeeBps = _platformFeeBps;
    }

    // -------------------------------------------------------------------------
    // Creator Management
    // -------------------------------------------------------------------------

    function setCreatorStatus(address creator, bool approved) external onlyOwner {
        approvedCreators[creator] = approved;
        emit CreatorStatusUpdated(creator, approved);
    }

    function setPlatformFee(uint256 newFeeBps, address newFeeRecipient) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert QuestArcade__InvalidFeeBps();
        platformFeeBps = newFeeBps;
        feeRecipient = newFeeRecipient;
        emit PlatformFeeUpdated(newFeeBps, newFeeRecipient);
    }

    // -------------------------------------------------------------------------
    // Quest Lifecycle
    // -------------------------------------------------------------------------

    function createQuest(
        string calldata title,
        string calldata description,
        uint256 rewardAmount,
        VerificationType verificationType,
        uint64 deadline
    ) external nonReentrant returns (uint256 questId) {
        // Removed approvedCreators check - any wallet user can now create quests
        if (bytes(title).length == 0) revert QuestArcade__InvalidQuest();
        if (rewardAmount == 0) revert QuestArcade__InvalidQuest();
        if (deadline <= block.timestamp) revert QuestArcade__DeadlineElapsed();
        if (uint8(verificationType) > uint8(VerificationType.GPS)) revert QuestArcade__InvalidVerificationType();

        questId = ++questCounter;

        Quest storage quest = quests[questId];
        quest.id = questId;
        quest.title = title;
        quest.description = description;
        quest.rewardAmount = rewardAmount;
        quest.verificationType = verificationType;
        quest.deadline = deadline;
        quest.creator = msg.sender;
        quest.status = QuestStatus.Open;
        quest.exists = true;

        creatorQuestIds[msg.sender].push(questId);

        IERC20(address(stableToken)).safeTransferFrom(msg.sender, address(this), rewardAmount);
        quest.rewardEscrowed = true;

        emit QuestCreated(questId, msg.sender, rewardAmount);
    }

    function updateQuest(
        uint256 questId,
        string calldata title,
        string calldata description,
        uint256 rewardAmount,
        uint64 deadline
    ) external nonReentrant questExists(questId) onlyQuestCreator(questId) {
        Quest storage quest = quests[questId];
        if (quest.status != QuestStatus.Open) revert QuestArcade__InvalidStatusTransition();
        if (deadline <= block.timestamp) revert QuestArcade__DeadlineElapsed();

        if (rewardAmount != quest.rewardAmount) {
            if (!quest.rewardEscrowed) revert QuestArcade__FundsNotEscrowed();
            if (rewardAmount > quest.rewardAmount) {
                uint256 additional = rewardAmount - quest.rewardAmount;
                IERC20(address(stableToken)).safeTransferFrom(msg.sender, address(this), additional);
            } else if (rewardAmount < quest.rewardAmount) {
                uint256 refund = quest.rewardAmount - rewardAmount;
                IERC20(address(stableToken)).safeTransfer(msg.sender, refund);
            }
            quest.rewardAmount = rewardAmount;
        }

        quest.title = title;
        quest.description = description;
        quest.deadline = deadline;

        emit QuestUpdated(questId);
    }

    function cancelQuest(uint256 questId)
        external
        nonReentrant
        questExists(questId)
        onlyQuestCreator(questId)
    {
        Quest storage quest = quests[questId];
        if (quest.status != QuestStatus.Open) revert QuestArcade__InvalidStatusTransition();

        quest.status = QuestStatus.Cancelled;
        quest.exists = false;

        if (quest.rewardEscrowed) {
            quest.rewardEscrowed = false;
            IERC20(address(stableToken)).safeTransfer(quest.creator, quest.rewardAmount);
        }

        emit QuestCancelled(questId);
    }

    function acceptQuest(uint256 questId) external questExists(questId) {
        Quest storage quest = quests[questId];

        if (quest.status != QuestStatus.Open) revert QuestArcade__InvalidStatusTransition();
        if (quest.creator == msg.sender) revert QuestArcade__Unauthorized();
        if (quest.deadline <= block.timestamp) revert QuestArcade__DeadlineElapsed();
        if (quest.worker != address(0)) revert QuestArcade__QuestAlreadyAccepted();

        quest.worker = msg.sender;
        quest.status = QuestStatus.Accepted;

        userQuestIds[msg.sender].push(questId);

        emit QuestAccepted(questId, msg.sender);
    }

    function submitProof(
        uint256 questId,
        string calldata proofCID,
        string calldata metadataCID
    ) external questExists(questId) onlyQuestWorker(questId) {
        Quest storage quest = quests[questId];

        if (quest.status != QuestStatus.Accepted) revert QuestArcade__InvalidStatusTransition();
        if (quest.deadline <= block.timestamp) revert QuestArcade__DeadlineElapsed();
        if (bytes(proofCID).length == 0) revert QuestArcade__InvalidQuest();

        quest.proofCID = proofCID;
        quest.proofMetadata = metadataCID;
        quest.status = QuestStatus.Submitted;

        emit QuestSubmitted(questId, msg.sender, proofCID);
    }

    function verifyQuest(uint256 questId, bool approved)
        external
        nonReentrant
        questExists(questId)
    {
        Quest storage quest = quests[questId];
        if (quest.status != QuestStatus.Submitted) revert QuestArcade__InvalidStatusTransition();
        if (msg.sender != quest.creator && msg.sender != owner()) revert QuestArcade__Unauthorized();

        if (approved) {
            quest.status = QuestStatus.Verified;
            emit QuestCompleted(questId, quest.worker, quest.status);
        } else {
            quest.status = QuestStatus.Rejected;
            _refundCreator(quest);
            emit QuestCompleted(questId, quest.worker, quest.status);
        }
    }

    function claimReward(uint256 questId)
        external
        nonReentrant
        questExists(questId)
        onlyQuestWorker(questId)
    {
        Quest storage quest = quests[questId];
        if (quest.status != QuestStatus.Verified) revert QuestArcade__InvalidStatusTransition();
        if (quest.rewardClaimed) revert QuestArcade__RewardAlreadyClaimed();

        _rewardWorker(quest);
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    function getQuestDetails(uint256 questId) external view questExists(questId) returns (Quest memory) {
        return quests[questId];
    }

    function getAvailableQuests() external view returns (Quest[] memory) {
        uint256 total = questCounter;
        uint256 count;
        for (uint256 i = 1; i <= total; i++) {
            if (quests[i].exists && quests[i].status == QuestStatus.Open) {
                count++;
            }
        }

        Quest[] memory available = new Quest[](count);
        uint256 index;
        for (uint256 i = 1; i <= total; i++) {
            if (quests[i].exists && quests[i].status == QuestStatus.Open) {
                available[index++] = quests[i];
            }
        }
        return available;
    }

    function getUserQuests(address user) external view returns (uint256[] memory) {
        return userQuestIds[user];
    }

    function getCreatorQuests(address creator) external view returns (uint256[] memory) {
        return creatorQuestIds[creator];
    }

    function getUserReputation(address user) external view returns (ReputationProfile memory profile) {
        uint256 xp = userXp[user];
        profile.xp = xp;
        profile.reputation = userReputation[user];
        profile.level = _getLevelLabel(xp);
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    function _rewardWorker(Quest storage quest) internal {
        if (!quest.rewardEscrowed) revert QuestArcade__FundsNotEscrowed();
        if (quest.rewardClaimed) revert QuestArcade__RewardAlreadyClaimed();

        quest.rewardClaimed = true;
        quest.rewardEscrowed = false;

        uint256 fee = (quest.rewardAmount * platformFeeBps) / FEE_DENOMINATOR;
        uint256 workerPayout = quest.rewardAmount - fee;

        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(address(stableToken)).safeTransfer(feeRecipient, fee);
        }

        IERC20(address(stableToken)).safeTransfer(quest.worker, workerPayout);

        _updateReputation(quest.worker, quest.rewardAmount, workerPayout);

        emit RewardClaimed(quest.id, quest.worker, workerPayout);
    }

    function _refundCreator(Quest storage quest) internal {
        if (!quest.rewardEscrowed) revert QuestArcade__FundsNotEscrowed();

        quest.rewardEscrowed = false;
        IERC20(address(stableToken)).safeTransfer(quest.creator, quest.rewardAmount);
    }

    function _updateReputation(address user, uint256 reward, uint256 payout) internal {
        uint256 xpGain = reward / 1e18;
        if (xpGain == 0) {
            xpGain = 1;
        }
        userXp[user] += xpGain;

        uint256 repGain = payout / 1e18;
        if (repGain == 0) {
            repGain = 1;
        }
        userReputation[user] += repGain;

        string memory newLevel = _getLevelLabel(userXp[user]);
        emit ReputationUpdated(user, userReputation[user], userXp[user], newLevel);
    }

    function _getLevelLabel(uint256 xp) internal pure returns (string memory) {
        if (xp >= 2500) return "Elite";
        if (xp >= 1000) return "Gold";
        if (xp >= 400) return "Silver";
        if (xp >= 150) return "Bronze";
        return "Rookie";
    }
}


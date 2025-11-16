// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuestRegistry
 * @notice Stores metadata and lifecycle state for quests surfaced by the QuestArcade ecosystem.
 *         Designed to be called by the main QuestArcade contract or the contract owner for admin tasks.
 */
contract QuestRegistry is Ownable {
    enum QuestState {
        Draft,
        Active,
        Submitted,
        Verified,
        Rejected,
        Cancelled
    }

    struct QuestMetadata {
        uint256 questId;
        address creator;
        string title;
        string description;
        string metadataURI;
        uint64 deadline;
        uint256 rewardAmount;
        QuestState state;
        bool exists;
    }

    error QuestRegistry__Unauthorized();
    error QuestRegistry__QuestAlreadyExists();
    error QuestRegistry__QuestNotFound();
    error QuestRegistry__InvalidQuest();

    event QuestRegistered(uint256 indexed questId, address indexed creator, QuestMetadata metadata);
    event QuestStateUpdated(uint256 indexed questId, QuestState previousState, QuestState newState);
    event QuestMetadataUpdated(uint256 indexed questId, string metadataURI, uint64 deadline, uint256 rewardAmount);
    event QuestArcadeUpdated(address indexed questArcade);

    mapping(uint256 => QuestMetadata) private _quests;
    address public questArcade;

    constructor() Ownable(msg.sender) {}

    modifier onlyManager() {
        if (msg.sender != owner() && msg.sender != questArcade) {
            revert QuestRegistry__Unauthorized();
        }
        _;
    }

    function setQuestArcade(address newQuestArcade) external onlyOwner {
        if (newQuestArcade == address(0)) {
            revert QuestRegistry__InvalidQuest();
        }
        questArcade = newQuestArcade;
        emit QuestArcadeUpdated(newQuestArcade);
    }

    function registerQuest(
        uint256 questId,
        address creator,
        string calldata title,
        string calldata description,
        string calldata metadataURI,
        uint64 deadline,
        uint256 rewardAmount
    ) external onlyManager {
        if (questId == 0 || creator == address(0) || bytes(title).length == 0) {
            revert QuestRegistry__InvalidQuest();
        }

        if (_quests[questId].exists) {
            revert QuestRegistry__QuestAlreadyExists();
        }

        QuestMetadata memory metadata = QuestMetadata({
            questId: questId,
            creator: creator,
            title: title,
            description: description,
            metadataURI: metadataURI,
            deadline: deadline,
            rewardAmount: rewardAmount,
            state: QuestState.Active,
            exists: true
        });

        _quests[questId] = metadata;
        emit QuestRegistered(questId, creator, metadata);
    }

    function updateQuestState(uint256 questId, QuestState newState) external onlyManager {
        QuestMetadata storage metadata = _quests[questId];
        if (!metadata.exists) {
            revert QuestRegistry__QuestNotFound();
        }
        QuestState previous = metadata.state;
        metadata.state = newState;

        emit QuestStateUpdated(questId, previous, newState);
    }

    function updateQuestMetadata(
        uint256 questId,
        string calldata metadataURI,
        uint64 deadline,
        uint256 rewardAmount
    ) external onlyManager {
        QuestMetadata storage metadata = _quests[questId];
        if (!metadata.exists) {
            revert QuestRegistry__QuestNotFound();
        }

        metadata.metadataURI = metadataURI;
        metadata.deadline = deadline;
        metadata.rewardAmount = rewardAmount;

        emit QuestMetadataUpdated(questId, metadataURI, deadline, rewardAmount);
    }

    function getQuest(uint256 questId) external view returns (QuestMetadata memory) {
        QuestMetadata memory metadata = _quests[questId];
        if (!metadata.exists) {
            revert QuestRegistry__QuestNotFound();
        }
        return metadata;
    }

    function questExists(uint256 questId) external view returns (bool) {
        return _quests[questId].exists;
    }
}


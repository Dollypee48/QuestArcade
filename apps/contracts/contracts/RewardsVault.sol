// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RewardsVault
 * @notice Escrows ERC20 rewards for quests and releases them once verification succeeds.
 *         Creators deposit funds directly, while the QuestArcade contract orchestrates payouts/refunds.
 */
contract RewardsVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Escrow {
        address token;
        address creator;
        uint256 amount;
        bool released;
        bool refunded;
        bool exists;
    }

    error RewardsVault__Unauthorized();
    error RewardsVault__InvalidQuest();
    error RewardsVault__AlreadyFunded();
    error RewardsVault__NothingToRelease();
    error RewardsVault__NothingToRefund();

    event QuestFunded(uint256 indexed questId, address indexed creator, address token, uint256 amount);
    event QuestRewardReleased(uint256 indexed questId, address indexed recipient, uint256 amount);
    event QuestRewardRefunded(uint256 indexed questId, address indexed creator, uint256 amount);
    event QuestArcadeUpdated(address indexed questArcade);

    mapping(uint256 => Escrow) private _escrows;
    address public questArcade;

    constructor() Ownable(msg.sender) {}

    modifier onlyQuestArcade() {
        if (msg.sender != questArcade) {
            revert RewardsVault__Unauthorized();
        }
        _;
    }

    function setQuestArcade(address newQuestArcade) external onlyOwner {
        questArcade = newQuestArcade;
        emit QuestArcadeUpdated(newQuestArcade);
    }

    function fundQuest(uint256 questId, IERC20 token, uint256 amount) external nonReentrant {
        if (questId == 0 || address(token) == address(0) || amount == 0) {
            revert RewardsVault__InvalidQuest();
        }
        Escrow storage escrow = _escrows[questId];
        if (escrow.exists) {
            revert RewardsVault__AlreadyFunded();
        }

        token.safeTransferFrom(msg.sender, address(this), amount);

        _escrows[questId] = Escrow({
            token: address(token),
            creator: msg.sender,
            amount: amount,
            released: false,
            refunded: false,
            exists: true
        });

        emit QuestFunded(questId, msg.sender, address(token), amount);
    }

    function releaseReward(uint256 questId, address recipient) external nonReentrant onlyQuestArcade {
        Escrow storage escrow = _escrows[questId];
        if (!escrow.exists || escrow.released) {
            revert RewardsVault__NothingToRelease();
        }
        if (escrow.refunded) {
            revert RewardsVault__NothingToRelease();
        }

        escrow.released = true;
        IERC20(escrow.token).safeTransfer(recipient, escrow.amount);

        emit QuestRewardReleased(questId, recipient, escrow.amount);
    }

    function refundCreator(uint256 questId) external nonReentrant onlyQuestArcade {
        Escrow storage escrow = _escrows[questId];
        if (!escrow.exists || escrow.refunded) {
            revert RewardsVault__NothingToRefund();
        }
        if (escrow.released) {
            revert RewardsVault__NothingToRefund();
        }

        escrow.refunded = true;
        IERC20(escrow.token).safeTransfer(escrow.creator, escrow.amount);

        emit QuestRewardRefunded(questId, escrow.creator, escrow.amount);
    }

    function getEscrow(uint256 questId) external view returns (Escrow memory) {
        return _escrows[questId];
    }
}

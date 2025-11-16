// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Reputation
 * @notice Tracks reputation and XP for QuestArcade participants. Only authorised addresses (QuestArcade or delegates)
 *         can mutate reputation scores.
 */
contract Reputation is Ownable {
    struct Profile {
        uint256 xp;
        uint256 reputation;
    }

    error Reputation__Unauthorized();

    event QuestArcadeUpdated(address indexed questArcade);
    event ReporterStatusUpdated(address indexed reporter, bool isAuthorized);
    event ReputationIncreased(address indexed account, uint256 xpGain, uint256 reputationGain, uint256 newXp, uint256 newReputation, string level);

    mapping(address => Profile) private _profiles;
    mapping(address => bool) private _reporters;
    address public questArcade;

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        if (msg.sender != questArcade && !_reporters[msg.sender]) {
            revert Reputation__Unauthorized();
        }
        _;
    }

    function setQuestArcade(address newQuestArcade) external onlyOwner {
        questArcade = newQuestArcade;
        emit QuestArcadeUpdated(newQuestArcade);
    }

    function setReporter(address reporter, bool isAuthorized) external onlyOwner {
        _reporters[reporter] = isAuthorized;
        emit ReporterStatusUpdated(reporter, isAuthorized);
    }

    function increaseReputation(
        address account,
        uint256 xpGain,
        uint256 reputationGain
    ) external onlyAuthorized returns (Profile memory) {
        Profile storage profile = _profiles[account];
        profile.xp += xpGain;
        profile.reputation += reputationGain;

        string memory level = levelForXp(profile.xp);
        emit ReputationIncreased(account, xpGain, reputationGain, profile.xp, profile.reputation, level);

        return profile;
    }

    function getProfile(address account) external view returns (Profile memory profile, string memory level) {
        profile = _profiles[account];
        level = levelForXp(profile.xp);
    }

    function levelForXp(uint256 xp) public pure returns (string memory) {
        if (xp >= 10_000) return "Mythic";
        if (xp >= 5_000) return "Legendary";
        if (xp >= 2_500) return "Elite";
        if (xp >= 1_000) return "Gold";
        if (xp >= 400) return "Silver";
        if (xp >= 150) return "Bronze";
        return "Rookie";
    }

    function isReporter(address reporter) external view returns (bool) {
        return _reporters[reporter];
    }
}

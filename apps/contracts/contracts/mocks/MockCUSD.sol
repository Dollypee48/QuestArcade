// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockCUSD
 * @dev Simple ERC20 token used to simulate cUSD in tests.
 */
contract MockCUSD is ERC20 {
    constructor() ERC20("Mock cUSD", "cUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}


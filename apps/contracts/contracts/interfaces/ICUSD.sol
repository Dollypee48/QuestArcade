// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ICUSD
 * @dev Minimal interface for the cUSD ERC20 token used on the Celo network.
 *      cUSD conforms to the ERC20 standard, so we simply extend IERC20.
 */
interface ICUSD is IERC20 {}


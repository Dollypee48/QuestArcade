import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition deployment module for the QuestArcade contract.
 *
 * Parameters:
 * - cUsdAddress: address of the cUSD ERC20 token on the target network.
 * - feeRecipient: address that will receive platform fees.
 * - platformFeeBps: fee expressed in basis points (1% = 100 bps).
 */
const QuestArcadeModule = buildModule("QuestArcadeModule", (m) => {
  const cUsdAddress = m.getParameter<string>("cUsdAddress");
  const feeRecipient = m.getParameter<string>("feeRecipient");
  const platformFeeBps = m.getParameter<number>("platformFeeBps", 500); // default 5%

  const questArcade = m.contract("QuestArcade", [
    cUsdAddress,
    feeRecipient,
    platformFeeBps,
  ]);

  return { questArcade };
});

export default QuestArcadeModule;


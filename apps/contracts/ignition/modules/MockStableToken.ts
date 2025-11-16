import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockStableTokenModule = buildModule("MockStableTokenModule", (m) => {
  const name = m.getParameter("name", "Mock cUSD");
  const symbol = m.getParameter("symbol", "mcUSD");
  const decimals = m.getParameter("decimals", 18);

  const mockToken = m.contract("MockERC20", [name, symbol, decimals]);

  const recipientsParam = m.getParameter<readonly `0x${string}`[] | `0x${string}`>(
    "recipients",
    []
  );
  const recipients = Array.isArray(recipientsParam) ? recipientsParam : [recipientsParam];
  const mintAmount = m.getParameter<bigint>("mintAmount", 0n);

  recipients
    .filter((recipient) => Boolean(recipient))
    .forEach((recipient, index) => {
      m.call(mockToken, "mint", [recipient, mintAmount], {
        id: `mint_${index}`,
      });
    });

  return { mockToken };
});

export default MockStableTokenModule;


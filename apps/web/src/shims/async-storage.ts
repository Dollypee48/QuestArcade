// Shim for @react-native-async-storage/async-storage in web builds.
// MetaMask SDK pulls this in but we don't need it in the browser.
// Exporting a minimal mock avoids module resolution errors.

const AsyncStorage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
  clear: async (): Promise<void> => {},
};

export default AsyncStorage;



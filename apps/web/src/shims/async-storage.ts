// Shim for @react-native-async-storage/async-storage in web builds.
// MetaMask SDK pulls this in but we don't need it in the browser.
// Exporting a minimal mock avoids module resolution errors.

const AsyncStorage = {
  getItem: async (): Promise<string | null> => null,
  setItem: async (): Promise<void> => {},
  removeItem: async (): Promise<void> => {},
  clear: async (): Promise<void> => {},
};

export default AsyncStorage;



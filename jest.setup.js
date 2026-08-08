// AsyncStorage talks to a native module that doesn't exist under Jest; the
// package ships an in-memory stand-in for exactly this.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

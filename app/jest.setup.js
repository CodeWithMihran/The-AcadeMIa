/* eslint-env jest */

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaInsetsContext: React.createContext(inset),
    SafeAreaFrameContext: React.createContext(frame),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: '/mock/document/dir',
      CacheDir: '/mock/cache/dir',
    },
    exists: jest.fn().mockResolvedValue(true),
    unlink: jest.fn().mockResolvedValue(true),
  },
  fetch: jest.fn().mockResolvedValue({
    info: () => ({ status: 200 }),
    path: () => '/mock/downloaded/path',
  }),
}));

jest.mock('react-native-pdf', () => 'Pdf');
jest.mock('react-native-webview', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => mockReact.createElement(View, props),
  };
});

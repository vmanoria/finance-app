// jest.config.cjs
module.exports = {
  testEnvironment: 'jsdom',
  globalSetup: '<rootDir>/tests/globalSetup.cjs',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  // Transform both test files and src files (needed when package.json has "type":"module")
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  // Allow babel-jest to transform src (and select node_modules that ship ESM)
  transformIgnorePatterns: [
    '/node_modules/(?!(recharts|d3-.*|internmap|robust-predicates)/)',
  ],
  moduleNameMapper: {
    // CSS modules → identity-obj-proxy; plain CSS → empty string
    '\\.css$': 'identity-obj-proxy',
    // Static assets (svg, png, etc.)
    '\\.(svg|png|jpg|jpeg|gif|webp)$': '<rootDir>/tests/__mocks__/fileMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  testMatch: [
    '**/tests/unit/**/*.test.[jt]s?(x)',
    '**/tests/integration/**/*.test.[jt]s?(x)',
    '**/tests/smoke/**/*.test.[jt]s?(x)',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'src/services/**/*.js',
    // yahooAdapter.js is a Node-only live-network file — excluded from coverage.
    // Its pure exports (ServiceError) are tested in yahooAdapter.test.js.
    '!src/services/yahooAdapter.js',
    'src/store/**/*.js',
    'src/components/**/*.{js,jsx}',
  ],
  // Per-directory thresholds let component coverage be tracked separately
  // from the pure-function layers which have a higher bar.
  // Branch thresholds are set conservatively for JSX components where
  // conditional rendering branches are hard to exercise in jsdom without
  // a full Recharts rendering stack.
  coverageThreshold: {
    global: {
      lines:    75,
      branches: 60,
    },
    './src/utils/': {
      lines:    90,
      branches: 84,
    },
    './src/services/': {
      lines:    80,
      branches: 65,
    },
  },
};

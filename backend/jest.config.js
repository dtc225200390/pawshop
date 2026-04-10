// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/server.js',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: ['./tests/setup/test-setup.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  openHandlesTimeout: 2000
};
// backend/tests/setup/test-setup.js
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

// Mock console logs
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Không setup database, dùng database chính
beforeAll(async () => {
  console.log('Using existing database for tests');
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
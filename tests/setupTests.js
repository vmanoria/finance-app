// tests/setupTests.js — global test setup
// Ensure mock mode is active for all test environments
process.env.VITE_USE_MOCK = 'true';

import '@testing-library/jest-dom';

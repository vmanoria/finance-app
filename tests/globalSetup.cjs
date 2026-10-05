// tests/globalSetup.cjs — runs once before all test suites
module.exports = async function () {
  process.env.VITE_USE_MOCK = 'true';
};

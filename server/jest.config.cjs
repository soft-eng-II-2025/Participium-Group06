/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  rootDir: './',
  moduleFileExtensions: ['js', 'ts', 'json'],

  // Esegui sia unit che integration
  testMatch: [
    '**/src/tests/unit/**/*.test.ts',         // test unitari
    '**/src/tests/integration/**/*.test.ts',  // test di integrazione
    '**/src/tests/e2e/**/*.test.ts',          // test di e2e

  ],

  // Setup dinamico a seconda del tipo di test
  setupFilesAfterEnv: ['./src/tests/setup-dynamic.ts'],

  clearMocks: true,
};

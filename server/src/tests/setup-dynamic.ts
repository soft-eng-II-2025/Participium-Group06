// src/tests/setup-dynamic.ts
const testType = process.env.JEST_TEST_TYPE;

if (testType === "integration") {
  // setup per test di integrazione (DB ricreato prima di ogni test)
  require("./integration/setup-db");
} else if (testType === "e2e") {
  // setup per test end-to-end
  require("./e2e/setup");
} else {
  // unit: qui potresti mettere un setup specifico per i test unitari, se serve
  // altrimenti non fare nulla
}
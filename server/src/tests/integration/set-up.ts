// src/tests/integration/setup-db.ts
import { TestDataSource } from "../test-data-source";

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});

beforeEach(async () => {
  // Drop schema e ricrealo da zero prima di OGNI test di integrazione
  await TestDataSource.synchronize(true);
});
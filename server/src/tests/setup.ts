// test/setup.ts
import { TestDataSource } from './test-data-source';
import { initializeApp } from '../index';

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await initializeApp(TestDataSource); // ora DataSource reale
  }
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});

beforeEach(async () => {
  if (!TestDataSource.isInitialized) throw new Error("DataSource not initialized");

  // Pulisce tutte le tabelle in ordine di dipendenza o usando CASCADE per gestire le foreign keys
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
  }
});

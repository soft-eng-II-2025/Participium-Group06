// src/tests/setup-e2e.ts
import { TestDataSource } from './test-data-source';
import { initializeApp } from '../index';

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await initializeApp(TestDataSource);
  }
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});

beforeEach(async () => {
  await TestDataSource.query('PRAGMA foreign_keys = OFF;');
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
  await TestDataSource.query('PRAGMA foreign_keys = ON;');
});

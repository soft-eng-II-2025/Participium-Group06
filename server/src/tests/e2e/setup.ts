// src/tests/e2e/setup.ts
import { TestDataSource } from "../test-data-source";

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }

  // eventualmente: seed di dati comuni per TUTTI gli e2e
  // es:
  // const roleRepo = TestDataSource.getRepository(Role);
  // await roleRepo.save({ title: "Admin", label: "Administrator" });
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});

// niente beforeEach qui: negli e2e di solito NON si resetta il DB a ogni test
// ma puoi aggiungere pulizia logica se ti serve
// // test/setup.ts
// import { TestDataSource } from './test-data-source';
// import { initializeApp } from '../index';

// beforeAll(async () => {
//   if (!TestDataSource.isInitialized) {
//     await initializeApp(TestDataSource); // ora DataSource reale
//   }
// });

// afterAll(async () => {
//   if (TestDataSource.isInitialized) {
//     await TestDataSource.destroy();
//   }
// });

// beforeEach(async () => {
//   if (!TestDataSource.isInitialized) throw new Error("DataSource not initialized");

//   // Prima le tabelle "figlie"
//   await TestDataSource.getRepository("ReportPhoto").clear();
//   await TestDataSource.getRepository("Report").clear();

//   // Poi tabelle principali
//   await TestDataSource.getRepository("User").clear();
//   await TestDataSource.getRepository("MunicipalityOfficer").clear();
// });

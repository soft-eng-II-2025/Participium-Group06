// src/tests/integration/repositories/ReportRepository.test.ts
import { TestDataSource } from '../../test-data-source'; // Percorso relativo a test-data-source.ts
import { ReportRepository } from '../../../repositories/ReportRepository'; // Percorso relativo a ReportRepository
import { Report } from '../../../models/Report';
import { User } from '../../../models/User';
import { Category } from '../../../models/Category';
import { ReportPhoto } from '../../../models/ReportPhoto';
import { DataSource, Repository } from 'typeorm';

// Importa tutte le entità per la pulizia del database
import { Role } from '../../../models/Role';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';


describe('ReportRepository (integration)', () => {
  let reportRepository: ReportRepository;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let reportOrmRepository: Repository<Report>;
  let reportPhotoOrmRepository: Repository<ReportPhoto>;


  let testUser: User;
  let testCategory: Category;
  let anotherTestUser: User;
  let anotherTestCategory: Category;


  // beforeEach viene eseguito prima di OGNI singolo test
  beforeEach(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }

    // Pulisce tutte le tabelle usando CASCADE per gestire le foreign keys
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
    }

    // Istanzia ReportRepository
    reportRepository = new ReportRepository(TestDataSource);

    // Ottieni i repository direttamente dal TestDataSource per l'uso nei test
    userRepository = TestDataSource.getRepository(User);
    categoryRepository = TestDataSource.getRepository(Category);
    reportOrmRepository = TestDataSource.getRepository(Report);
    reportPhotoOrmRepository = TestDataSource.getRepository(ReportPhoto);

    // Prepara un utente e una categoria per i test dei report
    testUser = new User();
    testUser.username = 'reporteruser';
    testUser.email = 'reporter@example.com';
    testUser.password = 'hashedpassword';
    testUser.first_name = 'Test';
    testUser.last_name = 'Reporter';
    await userRepository.save(testUser);

    testCategory = new Category();
    testCategory.name = 'Incidente';
    await categoryRepository.save(testCategory);

    anotherTestUser = new User();
    anotherTestUser.username = 'anotheruser';
    anotherTestUser.email = 'another@example.com';
    anotherTestUser.password = 'anotherpass';
    anotherTestUser.first_name = 'Another';
    anotherTestUser.last_name = 'User';
    await userRepository.save(anotherTestUser);

    anotherTestCategory = new Category();
    anotherTestCategory.name = 'Manutenzione';
    await categoryRepository.save(anotherTestCategory);
  });

  // --- Test per i metodi di ReportRepository ---

  it('dovrebbe aggiungere un report con user e category esistenti', async () => {
    const report = new Report();
    report.title = 'Buca sulla strada';
    report.description = 'Causata da forti piogge';
    report.latitude = 45.0;
    report.longitude = 9.0;
    report.user = testUser;       // Passa l'oggetto User completo o solo l'ID
    report.category = testCategory; // Passa l'oggetto Category completo o solo l'ID

    const savedReport = await reportRepository.add(report);

    expect(savedReport).toBeDefined();
    expect(savedReport.id).toBeDefined();
    expect(savedReport.title).toBe('Buca sulla strada');
    // Verifica che le relazioni siano state caricate e che gli ID corrispondano
    expect(savedReport.user.id).toBe(testUser.id);
    expect(savedReport.category.id).toBe(testCategory.id);

    const foundReport = await reportOrmRepository.findOne({
      where: { id: savedReport.id },
      relations: ['user', 'category']
    });
    expect(foundReport).not.toBeNull();
    expect(foundReport?.user.id).toBe(testUser.id);
    expect(foundReport?.category.id).toBe(testCategory.id);
  });

  it('dovrebbe lanciare un errore se user non esiste durante l\'aggiunta di un report', async () => {
    const report = new Report();
    report.title = 'Report con user inesistente';
    report.description = 'Descrizione';
    report.latitude = 1.0;
    report.longitude = 1.0;
    report.user = { id: 99999 } as User; // User inesistente
    report.category = testCategory;

    await expect(reportRepository.add(report)).rejects.toThrow('User not found for report creation.');
  });

  it('dovrebbe lanciare un errore se category non esiste durante l\'aggiunta di un report', async () => {
    const report = new Report();
    report.title = 'Report con category inesistente';
    report.description = 'Descrizione';
    report.latitude = 1.0;
    report.longitude = 1.0;
    report.user = testUser;
    report.category = { id: 99999 } as Category; // Category inesistente

    await expect(reportRepository.add(report)).rejects.toThrow('Category not found for report creation.');
  });


  it('dovrebbe trovare tutti i report con le relazioni caricate', async () => {
    const report1 = new Report();
    report1.title = 'Report 1';
    report1.description = 'Desc 1';
    report1.latitude = 45.1;
    report1.longitude = 9.1;
    report1.user = testUser;
    report1.category = testCategory;
    await reportRepository.add(report1);

    const report2 = new Report();
    report2.title = 'Report 2';
    report2.description = 'Desc 2';
    report2.latitude = 45.2;
    report2.longitude = 9.2;
    report2.user = anotherTestUser; // Usa un altro utente
    report2.category = anotherTestCategory; // Usa un'altra categoria
    await reportRepository.add(report2);

    const reports = await reportRepository.findAll();
    expect(reports).toBeDefined();
    expect(reports.length).toBe(2);
    expect(reports.some(r => r.title === 'Report 1')).toBe(true);
    expect(reports.some(r => r.title === 'Report 2')).toBe(true);

    // Verifica che le relazioni siano caricate correttamente
    const foundReport1 = reports.find(r => r.title === 'Report 1');
    expect(foundReport1?.user).toBeDefined();
    expect(foundReport1?.user.id).toBe(testUser.id);
    expect(foundReport1?.category).toBeDefined();
    expect(foundReport1?.category.id).toBe(testCategory.id);

    const foundReport2 = reports.find(r => r.title === 'Report 2');
    expect(foundReport2?.user).toBeDefined();
    expect(foundReport2?.user.id).toBe(anotherTestUser.id);
    expect(foundReport2?.category).toBeDefined();
    expect(foundReport2?.category.id).toBe(anotherTestCategory.id);
  });

  it('dovrebbe trovare i report per categoria con le relazioni caricate', async () => {
    const report1 = new Report();
    report1.title = 'Report Categoria 1';
    report1.description = 'Desc Categoria 1';
    report1.latitude = 46.0;
    report1.longitude = 10.0;
    report1.user = testUser;
    report1.category = testCategory;
    await reportRepository.add(report1);

    const report2 = new Report();
    report2.title = 'Report Categoria 2';
    report2.description = 'Desc Categoria 2';
    report2.latitude = 47.0;
    report2.longitude = 11.0;
    report2.user = anotherTestUser;
    report2.category = anotherTestCategory;
    await reportRepository.add(report2);

    const reports = await reportRepository.findByCategory(testCategory.id);
    expect(reports).toBeDefined();
    expect(reports.length).toBe(1);
    expect(reports[0].title).toBe('Report Categoria 1');
    expect(reports[0].category.id).toBe(testCategory.id);
    expect(reports[0].user).toBeDefined(); // Verifica relazione user
  });

  it('dovrebbe aggiungere una singola foto a un report', async () => {
    const report = new Report();
    report.title = 'Report con singola foto';
    report.description = 'Report per test foto singola';
    report.latitude = 40.0;
    report.longitude = 10.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const photo = new ReportPhoto();
    photo.photo = 'path/to/photo_single.jpg';
    photo.report = savedReport;

    const savedPhoto = await reportRepository.addPhoto(photo);

    expect(savedPhoto).toBeDefined();
    expect(savedPhoto.id).toBeDefined();
    expect(savedPhoto.photo).toBe('path/to/photo_single.jpg');
    expect(savedPhoto.report.id).toBe(savedReport.id);

    const reportWithPhoto = await reportOrmRepository.findOne({
      where: { id: savedReport.id },
      relations: ['photos']
    });
    expect(reportWithPhoto?.photos.length).toBe(1);
    expect(reportWithPhoto?.photos[0].photo).toBe('path/to/photo_single.jpg');
  });

  it('dovrebbe aggiungere più foto a un report', async () => {
    const report = new Report();
    report.title = 'Report con più foto';
    report.description = 'Report per test foto multiple';
    report.latitude = 40.0;
    report.longitude = 10.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const photo1 = new ReportPhoto();
    photo1.photo = 'path/to/multiple_photo1.jpg';
    // photo1.report = savedReport; // Report verrà aggiunto da addPhotosToReport

    const photo2 = new ReportPhoto();
    photo2.photo = 'path/to/multiple_photo2.jpg';
    // photo2.report = savedReport;

    const savedPhotos = await reportRepository.addPhotosToReport(savedReport, [photo1, photo2]);

    expect(savedPhotos).toBeDefined();
    expect(savedPhotos.length).toBe(2);
    expect(savedPhotos[0].id).toBeDefined();
    expect(savedPhotos[1].id).toBeDefined();
    expect(savedPhotos[0].report.id).toBe(savedReport.id);
    expect(savedPhotos[1].report.id).toBe(savedReport.id);

    const reportWithPhotos = await reportOrmRepository.findOne({
      where: { id: savedReport.id },
      relations: ['photos']
    });
    expect(reportWithPhotos?.photos.length).toBe(2);
    expect(reportWithPhotos?.photos.some(p => p.photo === 'path/to/multiple_photo1.jpg')).toBe(true);
    expect(reportWithPhotos?.photos.some(p => p.photo === 'path/to/multiple_photo2.jpg')).toBe(true);
  });

  it('dovrebbe trovare le foto per ID report', async () => {
    const report = new Report();
    report.title = 'Report per Ricerca Foto';
    report.description = 'Descrizione';
    report.latitude = 30.0;
    report.longitude = 10.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const photo1 = new ReportPhoto();
    photo1.photo = 'path/to/photoA.jpg';
    photo1.report = savedReport;
    await reportRepository.addPhoto(photo1);

    const photo2 = new ReportPhoto();
    photo2.photo = 'path/to/photoB.jpg';
    photo2.report = savedReport;
    await reportRepository.addPhoto(photo2);

    const foundPhotos = await reportRepository.findPhotosByReportId(savedReport.id);
    expect(foundPhotos).toBeDefined();
    expect(foundPhotos.length).toBe(2);
    expect(foundPhotos.some(p => p.photo === 'path/to/photoA.jpg')).toBe(true);
    expect(foundPhotos.some(p => p.photo === 'path/to/photoB.jpg')).toBe(true);
  });

  it('dovrebbe rimuovere un report e le sue foto associate (CASCADE)', async () => {
    const report = new Report();
    report.title = 'Report da Rimuovere';
    report.description = 'Descrizione';
    report.latitude = 20.0;
    report.longitude = 5.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const photo = new ReportPhoto();
    photo.photo = 'path/to/delete.jpg';
    photo.report = savedReport;
    await reportRepository.addPhoto(photo);

    expect(await reportOrmRepository.findOneBy({ id: savedReport.id })).toBeDefined();
    expect(await reportPhotoOrmRepository.findOneBy({ id: photo.id })).toBeDefined();

    await reportRepository.remove(savedReport);

    const foundReport = await reportOrmRepository.findOneBy({ id: savedReport.id });
    expect(foundReport).toBeNull();
    const foundPhoto = await reportPhotoOrmRepository.findOneBy({ id: photo.id });
    expect(foundPhoto).toBeNull(); // Con onDelete: 'CASCADE', la foto dovrebbe essere eliminata
  });

  /*it('dovrebbe rimuovere una singola foto da un report', async () => {
    const report = new Report();
    // ... crea e salva report ...
    const savedReport = await reportRepository.add(report);

    const photoToKeep = new ReportPhoto(); // <--- Rinomino per chiarezza
    photoToKeep.photo = 'path/to/photo_to_keep.jpg';
    photoToKeep.report = savedReport;
    const savedPhotoToKeep = await reportRepository.addPhoto(photoToKeep);

    const photoToRemove = new ReportPhoto(); // <--- Rinomino per chiarezza
    photoToRemove.photo = 'path/to/photo_to_remove.jpg';
    photoToRemove.report = savedReport;
    const savedPhotoToRemove = await reportRepository.addPhoto(photoToRemove);

    expect(await reportRepository.findPhotosByReportId(savedReport.id)).toHaveLength(2);

    // Rimuovi la foto che DOVREBBE essere rimossa
    await reportRepository.removePhoto(savedPhotoToRemove); // Usa savedPhotoToRemove

    const remainingPhotos = await reportRepository.findPhotosByReportId(savedReport.id);
    expect(remainingPhotos).toHaveLength(1);
    // Verifica che la foto rimanente sia quella che doveva rimanere
    expect(remainingPhotos[0].photo).toBe(savedPhotoToKeep.photo); // Confronta con l'oggetto salvato
    expect(remainingPhotos[0].id).toBe(savedPhotoToKeep.id);


    // Verifica che la foto che doveva essere rimossa NON ESISTA più nel database
    const removedPhotoCheck = await reportPhotoOrmRepository.findOneBy({ id: savedPhotoToRemove.id }); // Cerca per l'ID della foto rimossa
    expect(removedPhotoCheck).toBeNull();
  });*/

  it('dovrebbe cambiare la descrizione di un report', async () => {
    const report = new Report();
    report.title = 'Report Originale';
    report.description = 'Descrizione vecchia';
    report.latitude = 50.0;
    report.longitude = 15.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const updatedReport = await reportRepository.changeDescription(savedReport, 'Descrizione nuova');

    expect(updatedReport.description).toBe('Descrizione nuova');
    const foundReport = await reportOrmRepository.findOneBy({ id: savedReport.id });
    expect(foundReport?.description).toBe('Descrizione nuova');
  });

  it('dovrebbe cambiare il titolo di un report', async () => {
    const report = new Report();
    report.title = 'Titolo vecchio';
    report.description = 'Descrizione';
    report.latitude = 55.0;
    report.longitude = 20.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const updatedReport = await reportRepository.changeTitle(savedReport, 'Titolo nuovo');

    expect(updatedReport.title).toBe('Titolo nuovo');
    const foundReport = await reportOrmRepository.findOneBy({ id: savedReport.id });
    expect(foundReport?.title).toBe('Titolo nuovo');
  });
});
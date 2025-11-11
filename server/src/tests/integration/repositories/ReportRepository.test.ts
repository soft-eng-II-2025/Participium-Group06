// src/tests/integration/repositories/ReportRepository.test.ts
import { TestDataSource } from '../../test-data-source';
import { ReportRepository } from '../../../repositories/ReportRepository';
import { Report } from '../../../models/Report';
import { User } from '../../../models/User';
import { Category } from '../../../models/Category';
import { ReportPhoto } from '../../../models/ReportPhoto';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';
import { Role } from '../../../models/Role';
import { DataSource, Repository } from 'typeorm'; // Importa DataSource e Repository per i tipi

describe('ReportRepository (integration)', () => {
  let reportRepository: ReportRepository;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  // Otteniamo i repository direttamente da TestDataSource per i test,
  // senza passare per le proprietà protected di ReportRepository.
  let reportOrmRepository: Repository<Report>;
  let reportPhotoOrmRepository: Repository<ReportPhoto>;


  let testUser: User;
  let testCategory: Category;

  beforeEach(async () => {
    // Disabilita temporaneamente i controlli di FOREIGN KEY per SQLite
    // Questo permette di pulire le tabelle in qualsiasi ordine senza violazioni
    await TestDataSource.query("PRAGMA foreign_keys = OFF;");
    // Pulisci le tabelle in ordine inverso di dipendenza per evitare FK constraint failed
    // O puoi semplicemente usare clear() su tutte e affidarti a PRAGMA foreign_keys = OFF;
    const repositoryReportPhoto = TestDataSource.getRepository(ReportPhoto);
    const repositoryReport = TestDataSource.getRepository(Report);
    const repositoryUser = TestDataSource.getRepository(User);
    const repositoryCategory = TestDataSource.getRepository(Category);
    const repositoryMunicipalityOfficer =
      TestDataSource.getRepository(MunicipalityOfficer);
    const repositoryRole = TestDataSource.getRepository(Role);
    await repositoryReportPhoto.clear(); // Elimina prima le foto (dipende da Report)
    await repositoryReport.clear(); // Poi i report (dipende da User e Category)
    await repositoryUser.clear(); // Poi gli utenti
    await repositoryCategory.clear(); // Poi le categorie
    await repositoryMunicipalityOfficer.clear(); // Poi gli ufficiali
    await repositoryRole.clear(); // Poi i ruoli

    // Riabilita i controlli di FOREIGN KEY
    await TestDataSource.query("PRAGMA foreign_keys = ON;");

    // Istanzia ReportRepository
    reportRepository = new ReportRepository(TestDataSource);

    // Ottieni i repository direttamente dal TestDataSource per l'uso nei test
    userRepository = TestDataSource.getRepository(User);
    categoryRepository = TestDataSource.getRepository(Category);
    reportOrmRepository = TestDataSource.getRepository(Report);
    reportPhotoOrmRepository = TestDataSource.getRepository(ReportPhoto);

    // Prepara un utente e una categoria per i test dei report
    testUser = new User();
    testUser.username = "reporteruser";
    testUser.email = "reporter@example.com";
    testUser.password = "hashedpassword";
    testUser.first_name = "Test";
    testUser.last_name = "Reporter";
    await userRepository.save(testUser);
    testCategory = new Category();
    testCategory.name = "Incidente";
    await categoryRepository.save(testCategory);
  });

  // --- Test per i metodi di ReportRepository ---

  it('dovrebbe aggiungere e trovare un report per ID', async () => {
    const report = new Report();
    report.title = 'Buca sulla strada';
    report.description = 'Causata da forti piogge';
    report.latitude = 45.0;
    report.longitude = 9.0;
    report.user = testUser;
    report.category = testCategory;

    const savedReport = await reportRepository.add(report);

    expect(savedReport).toBeDefined();
    expect(savedReport.id).toBeDefined();
    expect(savedReport.title).toBe('Buca sulla strada');

    // Usa reportOrmRepository (ottenuto direttamente da TestDataSource) per la verifica
    const foundReport = await reportOrmRepository.findOne({
      where: { id: savedReport.id },
      relations: ['user', 'category', 'photos']
    });
    expect(foundReport).not.toBeNull();
    expect(foundReport?.title).toBe('Buca sulla strada');
    expect(foundReport?.user.id).toBe(testUser.id);
    expect(foundReport?.category.id).toBe(testCategory.id);
  });

  it('dovrebbe trovare tutti i report', async () => {
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
    report2.user = testUser;
    report2.category = testCategory;
    await reportRepository.add(report2);

    const reports = await reportRepository.findAll();
    expect(reports).toBeDefined();
    expect(reports.length).toBe(2);
    expect(reports.some(r => r.title === 'Report 1')).toBe(true);
    expect(reports.some(r => r.title === 'Report 2')).toBe(true);
    expect(reports[0].user).toBeDefined();
    expect(reports[0].category).toBeDefined();
  });

  it('dovrebbe trovare i report per categoria', async () => {
    const anotherCategory = new Category();
    anotherCategory.name = 'Manutenzione';
    await categoryRepository.save(anotherCategory);

    const report1 = new Report();
    report1.title = 'Report Categoria 1';
    report1.description = 'Desc Categoria 1';
    report1.latitude = 46.0;
    report1.longitude = 10.0;
    report1.user = testUser;
    report1.category = testCategory; // Categoria originale
    await reportRepository.add(report1);

    const report2 = new Report();
    report2.title = 'Report Categoria 2';
    report2.description = 'Desc Categoria 2';
    report2.latitude = 47.0;
    report2.longitude = 11.0;
    report2.user = testUser;
    report2.category = anotherCategory; // Altra categoria
    await reportRepository.add(report2);

    const reports = await reportRepository.findByCategory(testCategory.id);
    expect(reports).toBeDefined();
    expect(reports.length).toBe(1);
    expect(reports[0].title).toBe('Report Categoria 1');
    expect(reports[0].category.id).toBe(testCategory.id);
  });

  it('dovrebbe aggiungere una foto a un report', async () => {
    const report = new Report();
    report.title = 'Report con Foto';
    report.description = 'Report per test foto';
    report.latitude = 40.0;
    report.longitude = 10.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const photo = new ReportPhoto();
    photo.photo = 'path/to/photo1.jpg';
    photo.report = savedReport;

    const savedPhoto = await reportRepository.addPhoto(photo);

    expect(savedPhoto).toBeDefined();
    expect(savedPhoto.id).toBeDefined();
    expect(savedPhoto.photo).toBe('path/to/photo1.jpg');
    expect(savedPhoto.report.id).toBe(savedReport.id);

    // Usa reportOrmRepository per la verifica delle relazioni
    const reportWithPhoto = await reportOrmRepository.findOne({
      where: { id: savedReport.id },
      relations: ['photos']
    });
    expect(reportWithPhoto?.photos.length).toBe(1);
    expect(reportWithPhoto?.photos[0].photo).toBe('path/to/photo1.jpg');
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

  it('dovrebbe rimuovere un report', async () => {
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

    // Usa reportOrmRepository e reportPhotoOrmRepository per le verifiche
    expect(await reportOrmRepository.findOneBy({ id: savedReport.id })).toBeDefined();
    expect(await reportPhotoOrmRepository.findOneBy({ id: photo.id })).toBeDefined();

    await reportRepository.remove(savedReport);

    const foundReport = await reportOrmRepository.findOneBy({ id: savedReport.id });
    expect(foundReport).toBeNull();
    const foundPhoto = await reportPhotoOrmRepository.findOneBy({ id: photo.id });
    expect(foundPhoto).toBeNull();
  });

  it('dovrebbe rimuovere una foto da un report', async () => {
    const report = new Report();
    report.title = 'Report con Foto Multiple';
    report.description = 'Descrizione';
    report.latitude = 10.0;
    report.longitude = 2.0;
    report.user = testUser;
    report.category = testCategory;
    const savedReport = await reportRepository.add(report);

    const photo1 = new ReportPhoto();
    photo1.photo = 'path/to/photo_to_keep.jpg';
    photo1.report = savedReport;
    await reportRepository.addPhoto(photo1);

    const photo2 = new ReportPhoto();
    photo2.photo = 'path/to/photo_to_remove.jpg';
    photo2.report = savedReport;
    const savedPhoto2 = await reportRepository.addPhoto(photo2);

    expect(await reportRepository.findPhotosByReportId(savedReport.id)).toHaveLength(2);

    await reportRepository.removePhoto(savedPhoto2);

    const remainingPhotos = await reportRepository.findPhotosByReportId(savedReport.id);
    expect(remainingPhotos).toHaveLength(1);
    expect(remainingPhotos[0].photo).toBe('path/to/photo_to_keep.jpg');
    const removedPhotoCheck = await reportPhotoOrmRepository.findOneBy({ id: savedPhoto2.id });
    expect(removedPhotoCheck).toBeNull();
  });

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
    const foundReport = await reportOrmRepository.findOneBy({ id: savedReport.id }); // <--- Accesso diretto dal DataSource
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
    const foundReport = await reportOrmRepository.findOneBy({ id: savedReport.id }); // <--- Accesso diretto dal DataSource
    expect(foundReport?.title).toBe('Titolo nuovo');
  });
});
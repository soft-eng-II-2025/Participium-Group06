import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../../index';
import { TestDataSource } from '../test-data-source';
import { Category } from '../../models/Category';
import { User } from '../../models/User';
import { Report } from '../../models/Report';

beforeEach(async () => {
  await TestDataSource.query('PRAGMA foreign_keys = OFF;');
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
  await TestDataSource.query('PRAGMA foreign_keys = ON;');
});

describe('E2E: userRoutes', () => {
  test('GET /api/users/reports/categories -> ritorna tutte le categorie', async () => {
    const categoryRepo = TestDataSource.getRepository(Category);
    await categoryRepo.save([{ name: 'Rifiuti' }, { name: 'Buche' }]);

    const res = await request(app).get('/api/users/reports/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Rifiuti' }),
        expect.objectContaining({ name: 'Buche' })
      ])
    );
  });

  test('POST /api/users/reports/images/upload -> carica immagini e restituisce URLs', async () => {
    const imagePath = path.join(__dirname, '../fixtures/sample.jpg');
    if (!fs.existsSync(imagePath)) {
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      fs.writeFileSync(imagePath, 'fake image data');
    }

    const res = await request(app)
      .post('/api/users/reports/images/upload')
      .attach('images', imagePath);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.urls)).toBe(true);
    expect(res.body.urls[0]).toMatch(/\/uploads\/\d+-sample\.jpg$/);
  });

  test('POST /api/users/reports -> crea un nuovo report', async () => {
    const userRepo = TestDataSource.getRepository(User);
    const categoryRepo = TestDataSource.getRepository(Category);

    const user = await userRepo.save({
      username: 'testuser',
      email: 'a@a.com',
      password: '1234',
      first_name: 'Test',
      last_name: 'User'
    });
    const category = await categoryRepo.save({ name: 'Illuminazione' });

    const res = await request(app)
      .post('/api/users/reports')
      .send({
        longitude: 12.34,
        latitude: 56.78,
        title: 'Lampione rotto',
        description: 'Nessuna luce nella via principale',
        user: { username: 'testuser' },
        categoryId: category.id,
        photos: ['/uploads/fake.jpg']
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('title', 'Lampione rotto');

    const reports = await TestDataSource.getRepository(Report).find();
    expect(reports.length).toBe(1);
  });
});

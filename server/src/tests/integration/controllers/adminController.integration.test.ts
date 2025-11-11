import { AppDataSource } from '../../../data-source';
import { addMunicipalityOfficer } from '../../../controllers/adminController';
import { Role } from '../../../models/Role';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';
import { RoleRepository } from '../../../repositories/RoleRepository';
import { MunicipalityOfficerRepository } from '../../../repositories/MunicipalityOfficerRepository';

describe('addMunicipalityOfficer (integration)', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    for (const entity of AppDataSource.entityMetadatas) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM "${entity.tableName}";`);
    }
  });

  it('creates a municipality officer successfully with an existing role', async () => {
    const roleRepository = new RoleRepository(); 
    const officerRepository = new MunicipalityOfficerRepository();

    const newRole = new Role();
    newRole.title = 'Officer';
    const role = await roleRepository.add(newRole);

    const result = await addMunicipalityOfficer({
      username: 'TestUser',
      email: 'Test@Example.com',
      password: 'StrongPassword123!',
      first_name: 'Test',
      last_name: 'User',
      role: { title: role.title },
    });

    const officer = await officerRepository.findByusername('testuser');

    expect(officer).toBeDefined();
    expect(officer!.email).toBe('test@example.com');
    expect(officer!.role!.title).toBe('Officer');
    expect(result.username).toBe('testuser');
  });

  it('throws when the role does not exist', async () => {
    await expect(
      addMunicipalityOfficer({
        username: 'NoRoleUser',
        email: 'norole@example.com',
        password: '12345678',
        first_name: 'No',
        last_name: 'Role',
        role: { title: 'MissingRole' },
      })
    ).rejects.toThrow('ROLE_NOT_FOUND');
  });
});

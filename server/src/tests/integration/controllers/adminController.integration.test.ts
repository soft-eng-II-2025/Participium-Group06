import { TestDataSource } from '../../test-data-source';
import { addMunicipalityOfficer } from '../../../controllers/adminController';
import { Role } from '../../../models/Role';
import { MunicipalityOfficerRepository } from '../../../repositories/MunicipalityOfficerRepository';
import { RoleRepository } from '../../../repositories/RoleRepository';

describe('addMunicipalityOfficer (integration)', () => {
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
    // Clear all tables
    for (const entity of TestDataSource.entityMetadatas) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM "${entity.tableName}";`);
    }
  });

  it('creates a municipality officer successfully with an existing role', async () => {
    const roleRepository = new RoleRepository(TestDataSource);
    const officerRepository = new MunicipalityOfficerRepository(TestDataSource);

    // Create a role
    const newRole = new Role();
    newRole.title = 'Officer';
    const role = await roleRepository.add(newRole);

    // Pass TestDataSource explicitly
    const result = await addMunicipalityOfficer(
      {
        username: 'TestUser',
        email: 'Test@Example.com',
        password: 'StrongPassword123!',
        first_name: 'Test',
        last_name: 'User',
        role: { title: role.title },
      },
      TestDataSource
    );

    const officer = await officerRepository.findByusername('testuser');

    expect(officer).toBeDefined();
    expect(officer!.email).toBe('test@example.com');
    expect(officer!.role!.title).toBe('Officer');
    expect(result.username).toBe('testuser');
  });

  it('throws when the role does not exist', async () => {
    await expect(
      addMunicipalityOfficer(
        {
          username: 'NoRoleUser',
          email: 'norole@example.com',
          password: '12345678',
          first_name: 'No',
          last_name: 'Role',
          role: { title: 'MissingRole' },
        },
        TestDataSource
      )
    ).rejects.toThrow('ROLE_NOT_FOUND');
  });
});

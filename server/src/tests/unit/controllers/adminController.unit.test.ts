// src/tests/unit/controllers/adminController.unit.test.ts

import { addMunicipalityOfficer } from '../../../controllers/adminController';
import * as passwordService from '../../../services/passwordService';
import * as mapperService from '../../../services/mapperService';
import { RoleRepository } from '../../../repositories/RoleRepository';
import { MunicipalityOfficerRepository } from '../../../repositories/MunicipalityOfficerRepository';

jest.mock('../../../services/passwordService');
jest.mock('../../../services/mapperService');
jest.mock('../../../repositories/RoleRepository');
jest.mock('../../../repositories/MunicipalityOfficerRepository');

describe('addMunicipalityOfficer (unit)', () => {
  const fakeRole = { id: 1, title: 'Officer' ,municipalityOfficer: []};
  const fakeOfficerDAO = {
    id: 10,
    username: 'testuser',
    email: 'test@example.com',
    password: 'someHashedPassword',  
    first_name: 'Test',
    last_name: 'User',
    role: fakeRole,
    };

  const fakeResponseDTO = {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: { title: 'Officer' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws PASSWORD_REQUIRED if password missing', async () => {
    await expect(
      addMunicipalityOfficer({
        username: 'user',
        email: 'user@example.com',
        password: '',
        first_name: 'Test',
        last_name: 'User',
      } as any)
    ).rejects.toThrow('PASSWORD_REQUIRED');
  });

  it('creates officer without role', async () => {
    // Arrange
    (passwordService.hashPassword as jest.Mock).mockResolvedValue('hashed123');
    (mapperService.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValue(fakeResponseDTO);

    // Spy on the add method of the repository prototype
    const addSpy = jest
      .spyOn(MunicipalityOfficerRepository.prototype, 'add')
      .mockResolvedValue(fakeOfficerDAO);

    // Act
    const result = await addMunicipalityOfficer({
      username: 'TestUser',
      email: 'Test@Example.com',
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User',
    });

    // Assert
    expect(passwordService.hashPassword).toHaveBeenCalledWith('Password123!');
    expect(addSpy).toHaveBeenCalled();
    expect(result.username).toBe('testuser');

    // Clean up the spy
    addSpy.mockRestore();
  });

  it('throws ROLE_NOT_FOUND if role title not found', async () => {
    // Spy on the findByTitle method of RoleRepository prototype
    const findByTitleSpy = jest
      .spyOn(RoleRepository.prototype, 'findByTitle')
      .mockResolvedValue(null);

    await expect(
      addMunicipalityOfficer({
        username: 'TestUser',
        email: 'test@example.com',
        password: '123456',
        first_name: 'Test',
        last_name: 'User',
        role: { title: 'FakeRole' },
      })
    ).rejects.toThrow('ROLE_NOT_FOUND');

    findByTitleSpy.mockRestore();
  });
});

import {
  addMunicipalityOfficer,
  getAllMunicipalityOfficer,
  updateMunicipalityOfficer,
  loginOfficer,
  getAllRoles,
  getMunicipalityOfficerByUsername,
  getMunicipalityOfficerDAOForNewRequest,
  getMunicipalityOfficerDAOByUsername,
  assignTechAgent,
  getAgentsByTechLeadUsername,
  getTechReports,
  getTechLeadReports,
  getOfficerById,
  getOfficerIdByEmail,
  getOfficerIdByUsername,
  initializeAdminRepositories
} from '../../../controllers/adminController';

import {
  updateReportOfficer
} from '../../../controllers/reportController';

import {
  mockTechLeadDAO,
  mockTechAgentDAO,
  mockReportResponseDTO,
  mockOfficerResponseDTO,
  mockUserResponseDTO,
  mockChatResponseDTOs
} from '../../utils';

import { MunicipalityOfficerRepository } from "../../../repositories/MunicipalityOfficerRepository";
import { RoleRepository } from "../../../repositories/RoleRepository";
import { CategoryRepository } from "../../../repositories/CategoryRepository";
import { ReportRepository } from "../../../repositories/ReportRepository";

// mock dei servizi utilizzati dal controller (password & mapper)
jest.mock('../../../controllers/reportController');
jest.mock('../../../services/passwordService');
jest.mock('../../../services/mapperService');

jest.mock("../../../repositories/MunicipalityOfficerRepository");
jest.mock("../../../repositories/RoleRepository");
jest.mock("../../../repositories/CategoryRepository");
jest.mock("../../../repositories/ReportRepository");

describe('assignTechAgent', () => {
  let mockMunicipalityOfficerRepository: any;
  let mockRoleRepository: any;
  let mockCategoryRepository: any;
  let mockReportRepository: any;

  // --- Dati di Test ---
  const mockTechLead = mockTechLeadDAO();
  const mockOfficer = mockTechAgentDAO();
  const officerDTO = mockOfficerResponseDTO(false);
  const userDTO = mockUserResponseDTO();
  const chatDTOs = mockChatResponseDTOs();
  const expectedReportDTO = mockReportResponseDTO(1, officerDTO, userDTO, chatDTOs);

  beforeEach(() => {
    jest.clearAllMocks();

    mockMunicipalityOfficerRepository = {
      findByUsername: jest.fn()
    };
    mockRoleRepository = {};
    mockCategoryRepository = {};
    mockReportRepository = {};

    (MunicipalityOfficerRepository as unknown as jest.Mock).mockImplementation(() => mockMunicipalityOfficerRepository);
    (RoleRepository as unknown as jest.Mock).mockImplementation(() => mockRoleRepository);
    (CategoryRepository as unknown as jest.Mock).mockImplementation(() => mockCategoryRepository);
    (ReportRepository as unknown as jest.Mock).mockImplementation(() => mockReportRepository);

    initializeAdminRepositories({} as any);
    (updateReportOfficer as jest.Mock).mockReturnValue(expectedReportDTO);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe assegnare il report all\'officer e tech lead e ritornare il ReportResponseDTO', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockTechLead);

    const reportId = 1;
    const officerUsername = mockOfficer.username;
    const techLeadUsername = mockTechLead.username;

    const result = await assignTechAgent(reportId, officerUsername, techLeadUsername);

    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledTimes(2);
    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledWith(officerUsername);
    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledWith(techLeadUsername);

    expect(updateReportOfficer).toHaveBeenCalledTimes(1);
    expect(updateReportOfficer).toHaveBeenCalledWith(reportId, mockOfficer, mockTechLead);

    expect(result).toEqual(expectedReportDTO);
  });

  it('dovrebbe lanciare un errore 404 se il Tech Lead non è trovato', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);

    const executionPromise = assignTechAgent(1, mockOfficer.username, mockTechLead.username);

    await expect(executionPromise).rejects.toHaveProperty('message', 'TECH_LEAD_NOT_FOUND');
    await expect(executionPromise).rejects.toHaveProperty('status', 404);

    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledTimes(2);
    expect(updateReportOfficer).not.toHaveBeenCalled();
  });

  it('dovrebbe lanciare un errore 404 se l\'Officer non è trovato (test order of checks)', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockTechLead);

    const executionPromise = assignTechAgent(1, mockOfficer.username, mockTechLead.username);

    await expect(executionPromise).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
    await expect(executionPromise).rejects.toHaveProperty('status', 404);

    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledTimes(2);
    expect(updateReportOfficer).not.toHaveBeenCalled();
  });
});


describe('adminController - other functions', () => {
  let mockMunicipalityOfficerRepository: any;
  let mockRoleRepository: any;
  let mockCategoryRepository: any;
  let mockReportRepository: any;
  const mapper = require('../../../services/mapperService');
  const passwordService = require('../../../services/passwordService');
  const reportController = require('../../../controllers/reportController');

  const mockTechLead = mockTechLeadDAO();
  const mockOfficer = mockTechAgentDAO();
  const officerDTO = mockOfficerResponseDTO(false);
  const leadOfficerDTO = mockOfficerResponseDTO(true);
  const userDTO = mockUserResponseDTO();
  const chatDTOs = mockChatResponseDTOs();
  const expectedReportDTO = mockReportResponseDTO(1, officerDTO, userDTO, chatDTOs);

  beforeEach(() => {
    jest.clearAllMocks();

    mockMunicipalityOfficerRepository = {
      findByUsername: jest.fn(),
      findAllVisible: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      findByRoleTitle: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    mockRoleRepository = {
      findAssignable: jest.fn(),
      findByTitle: jest.fn()
    };
    mockCategoryRepository = {
      findByRoleId: jest.fn()
    };
    mockReportRepository = {
      findByOfficer: jest.fn()
    };

    (MunicipalityOfficerRepository as unknown as jest.Mock).mockImplementation(() => mockMunicipalityOfficerRepository);
    (RoleRepository as unknown as jest.Mock).mockImplementation(() => mockRoleRepository);
    (CategoryRepository as unknown as jest.Mock).mockImplementation(() => mockCategoryRepository);
    (ReportRepository as unknown as jest.Mock).mockImplementation(() => mockReportRepository);

    initializeAdminRepositories({} as any);

    // mapper & password mocks: defaults (override per-test if needed)
    mapper.mapCreateOfficerRequestDTOToDAO = jest.fn().mockResolvedValue(mockOfficer);
    mapper.mapMunicipalityOfficerDAOToDTO = jest.fn().mockReturnValue(officerDTO);
    mapper.mapReportDAOToDTO = jest.fn().mockReturnValue(expectedReportDTO);
    passwordService.verifyPassword = jest.fn().mockResolvedValue(true);

    // report controller helper
    reportController.getReportsByCategoryIdAndStatus = jest.fn().mockResolvedValue([expectedReportDTO]);
  });

  // addMunicipalityOfficer
  it('addMunicipalityOfficer should create officer and return DTO', async () => {
    const createDto: any = { username: 'mocktechagent', email: 'a@b.com', password: 'pass', first_name: 'x', last_name: 'y' };
    mockMunicipalityOfficerRepository.add.mockResolvedValueOnce(mockOfficer);
    (mapper.mapCreateOfficerRequestDTOToDAO as jest.Mock).mockResolvedValueOnce(mockOfficer);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValueOnce(officerDTO);

    const result = await addMunicipalityOfficer(createDto);

    expect(mapper.mapCreateOfficerRequestDTOToDAO).toHaveBeenCalledWith(createDto);
    expect(mockMunicipalityOfficerRepository.add).toHaveBeenCalledTimes(1);
    expect(result).toEqual(officerDTO);
  });

  it('addMunicipalityOfficer should throw when password missing', async () => {
    const createDto: any = { username: 'u', email: 'e' }; // no password
    await expect(addMunicipalityOfficer(createDto)).rejects.toHaveProperty('message', 'PASSWORD_REQUIRED');
  });

  // getAllMunicipalityOfficer
  it('getAllMunicipalityOfficer should return mapped list', async () => {
    mockMunicipalityOfficerRepository.findAllVisible.mockResolvedValueOnce([mockOfficer, mockTechLead]);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockImplementation((dao: any) => {
      return dao.username === mockTechLead.username ? leadOfficerDTO : officerDTO;
    });

    const res = await getAllMunicipalityOfficer();
    expect(mockMunicipalityOfficerRepository.findAllVisible).toHaveBeenCalledTimes(1);
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual(officerDTO);
  });

  // updateMunicipalityOfficer - success
  it('updateMunicipalityOfficer should assign role and return DTO', async () => {
    const request: any = { username: mockOfficer.username, rolesTitle: ['SOME_ROLE'], external: false };
    const existing = { ...mockOfficer, roles: [], external: false };

    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(existing);
    mockRoleRepository.findByTitle.mockResolvedValueOnce({ id: 5, title: 'SOME_ROLE', label: 'L' });
    mockMunicipalityOfficerRepository.update.mockResolvedValueOnce(existing);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValueOnce(officerDTO);

    const res = await updateMunicipalityOfficer(request);
    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledWith(request.username);
    expect(mockRoleRepository.findByTitle).toHaveBeenCalledWith('SOME_ROLE');
    expect(mockMunicipalityOfficerRepository.update).toHaveBeenCalled();
    expect(res).toEqual(officerDTO);
  });

  // it('updateMunicipalityOfficer should throw ROLE_ALREADY_ASSIGNED', async () => {
  //   const request: any = { username: mockOfficer.username, rolesTitle: ['SOME_ROLE'] };
  //   const existing = { ...mockOfficer, roles: [{ id: 1, title: 'ALREADY' }] };

  //   mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(existing);

  //   await expect(updateMunicipalityOfficer(request)).rejects.toHaveProperty('message', 'ROLE_ALREADY_ASSIGNED');
  // });

  it('updateMunicipalityOfficer should throw ROLE_NOT_FOUND', async () => {
    const request: any = { username: mockOfficer.username, rolesTitle: ['SOME_ROLE'] };
    const existing = { ...mockOfficer, roles: [] };

    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(existing);
    mockRoleRepository.findByTitle.mockResolvedValueOnce(null);

    await expect(updateMunicipalityOfficer(request)).rejects.toHaveProperty('message', 'ROLE_NOT_FOUND');
  });

  // loginOfficer
  it('loginOfficer should verify and return DTO', async () => {
    const login = { username: mockOfficer.username, password: 'plain' };
    const officerWithPass = { ...mockOfficer, password: 'hashed' };

    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(officerWithPass);
    (passwordService.verifyPassword as jest.Mock).mockResolvedValueOnce(true);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValueOnce(officerDTO);

    const res = await loginOfficer(login as any);
    expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledWith(login.username);
    expect(passwordService.verifyPassword).toHaveBeenCalledWith(officerWithPass.password, login.password);
    expect(res).toEqual(officerDTO);
  });

  it('loginOfficer should throw INVALID_CREDENTIALS if verify fails', async () => {
    const login = { username: mockOfficer.username, password: 'plain' };
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce({ ...mockOfficer, password: 'h' });
    (passwordService.verifyPassword as jest.Mock).mockResolvedValueOnce(false);

    await expect(loginOfficer(login as any)).rejects.toHaveProperty('message', 'INVALID_CREDENTIALS');
  });

  // getAllRoles
  it('getAllRoles should map roles list', async () => {
    const roles = [{ id: 1, title: 'T1', label: 'L1' }, { id: 2, title: 'T2', label: 'L2' }];
    mockRoleRepository.findAssignable.mockResolvedValueOnce(roles);

    const res = await getAllRoles();
    expect(mockRoleRepository.findAssignable).toHaveBeenCalledTimes(1);
    expect(res).toEqual(roles.map(r => ({ id: r.id, title: r.title, label: r.label })));
  });

  // getMunicipalityOfficerByUsername
  it('getMunicipalityOfficerByUsername should return DTO', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValueOnce(officerDTO);

    const res = await getMunicipalityOfficerByUsername(mockOfficer.username);
    expect(res).toEqual(officerDTO);
  });

  it('getMunicipalityOfficerByUsername should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    await expect(getMunicipalityOfficerByUsername('nope')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  // getMunicipalityOfficerDAOForNewRequest
  it('getMunicipalityOfficerDAOForNewRequest should return officer DAO', async () => {
    mockMunicipalityOfficerRepository.findByRoleTitle.mockResolvedValueOnce([mockOfficer]);
    const res = await getMunicipalityOfficerDAOForNewRequest();
    expect(res).toEqual(mockOfficer);
  });

  it('getMunicipalityOfficerDAOForNewRequest should throw NO_OFFICER_AVAILABLE', async () => {
    mockMunicipalityOfficerRepository.findByRoleTitle.mockResolvedValueOnce([]);
    await expect(getMunicipalityOfficerDAOForNewRequest()).rejects.toHaveProperty('message', 'NO_OFFICER_AVAILABLE');
  });

  // getMunicipalityOfficerDAOByUsername
  it('getMunicipalityOfficerDAOByUsername should return DAO', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
    const res = await getMunicipalityOfficerDAOByUsername(mockOfficer.username);
    expect(res).toEqual(mockOfficer);
  });

  it('getMunicipalityOfficerDAOByUsername should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    await expect(getMunicipalityOfficerDAOByUsername('x')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  // getAgentsByTechLeadUsername
  it('getAgentsByTechLeadUsername should return mapped tech agents', async () => {
    const techLead = { ...mockTechLead };
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(techLead);
    mockMunicipalityOfficerRepository.findByRoleTitle.mockResolvedValueOnce([mockOfficer]);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValueOnce(officerDTO);

    const res = await getAgentsByTechLeadUsername(techLead.username);
    expect(res).toHaveLength(1);
    expect(res[0]).toEqual(officerDTO);
  });

  it('getAgentsByTechLeadUsername should throw INVALID_TECH_LEAD_LABEL', async () => {
    const notLead = { ...mockTechLead, roles: [{ title: 'WRONG_LABEL' }] } as any;
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(notLead);

    await expect(getAgentsByTechLeadUsername(notLead.username)).rejects.toHaveProperty('message', 'INVALID_TECH_LEAD_LABEL');
  });

  it('getAgentsByTechLeadUsername should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    await expect(getAgentsByTechLeadUsername('nope')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  // getTechReports
  it('getTechReports should return mapped reports', async () => {
    // controller has a lowercase findByusername call; support both in mock
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
    mockReportRepository.findByOfficer.mockResolvedValueOnce([{}]); // dummy DAO
    (mapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(expectedReportDTO);

    const res = await getTechReports(mockOfficer.username);
    expect(res).toHaveLength(1);
    expect(mockReportRepository.findByOfficer).toHaveBeenCalled();
  });

  it('getTechReports should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    await expect(getTechReports('x')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  // getTechLeadReports
  it('getTechLeadReports should aggregate reports from categories', async () => {
    const officer = { ...mockTechLead };
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(officer);
    mockCategoryRepository.findByRoleId.mockResolvedValueOnce([{ id: 99 }]);
    reportController.getReportsByCategoryIdAndStatus.mockResolvedValueOnce([expectedReportDTO]);

    const res = await getTechLeadReports(officer.username);
    expect(mockCategoryRepository.findByRoleId).toHaveBeenCalledWith(officer.roles?.[0].id);
    expect(res).toEqual([expectedReportDTO]);
  });

  it('getTechLeadReports should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    await expect(getTechLeadReports('x')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  // getOfficerById
  it('getOfficerById should return DTO', async () => {
    mockMunicipalityOfficerRepository.findById.mockResolvedValueOnce(mockOfficer);
    (mapper.mapMunicipalityOfficerDAOToDTO as jest.Mock).mockReturnValueOnce(officerDTO);
    const res = await getOfficerById(123);
    expect(res).toEqual(officerDTO);
  });

  it('getOfficerById should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findById.mockResolvedValueOnce(null);
    await expect(getOfficerById(1)).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  // getOfficerIdByEmail / getOfficerIdByUsername
  it('getOfficerIdByEmail should return id', async () => {
    mockMunicipalityOfficerRepository.findByEmail.mockResolvedValueOnce({ id: 55 });
    const res = await getOfficerIdByEmail('a@b.com');
    expect(res).toBe(55);
  });

  it('getOfficerIdByEmail should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByEmail.mockResolvedValueOnce(null);
    await expect(getOfficerIdByEmail('x')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });

  it('getOfficerIdByUsername should return id', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce({ id: 66 });
    const res = await getOfficerIdByUsername('user');
    expect(res).toBe(66);
  });

  it('getOfficerIdByUsername should throw OFFICER_NOT_FOUND', async () => {
    mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);
    await expect(getOfficerIdByUsername('x')).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
  });
});
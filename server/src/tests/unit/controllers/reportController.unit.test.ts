import {
  addReport,
  updateReportStatus,
  updateReportOfficer,
  getAllReports,
  getReportById,
  GetReportsByOfficerUsername,
  getAllAcceptedReports,
  getReportsByCategoryIdAndStatus,
  getUserReports,
  initializeReportRepositories
} from '../../../controllers/reportController';

import * as adminController from '../../../controllers/adminController';
import { ReportRepository } from '../../../repositories/ReportRepository';
import { NotificationRepository } from '../../../repositories/NotificationRepository';
import { SocketService } from '../../../services/socketService';
import * as messagingController from '../../../controllers/messagingController';
import { Server } from 'socket.io';
import { StatusType } from '../../../models/StatusType';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';

// utils mocks
import {
  mockTechAgentDAO,
  mockReportResponseDTO,
  mockTechLeadDAO
} from '../../utils';

// Mock external modules
jest.mock('../../../repositories/ReportRepository');
jest.mock('../../../repositories/NotificationRepository');
jest.mock('../../../services/socketService');
jest.mock('../../../services/mapperService');
jest.mock('../../../controllers/messagingController');
jest.mock('../../../controllers/adminController');

describe('reportController (unit)', () => {
  let mockReportRepository: any;
  let mockNotificationRepository: any;
  let mockSocketService: any;
  const mockMapper = require('../../../services/mapperService');

  const mockReportDTO = mockReportResponseDTO(1);

  beforeEach(() => {
    jest.clearAllMocks();

    mockReportRepository = {
      add: jest.fn(),
      addPhotosToReport: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByCategoryId: jest.fn(),
      findApproved: jest.fn(),
      findByUserId: jest.fn(),
      findByOfficer: jest.fn()
    };

    mockNotificationRepository = {
      add: jest.fn()
    };

    mockSocketService = {
      sendNotificationToUser: jest.fn()
    };

    (ReportRepository as unknown as jest.Mock).mockImplementation(() => mockReportRepository);
    (NotificationRepository as unknown as jest.Mock).mockImplementation(() => mockNotificationRepository);
    (SocketService as unknown as jest.Mock).mockImplementation(() => mockSocketService);

    // default mapper behavior
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValue(mockReportDTO);
    (mockMapper.mapCreateReportRequestToDAO as jest.Mock).mockImplementation((r: any) => {
      return { ...r }; // simple passthrough DAO-like object
    });

    // messaging controller
    (messagingController.createChatOfficerUser as jest.Mock).mockResolvedValue(true);
    (messagingController.createChatLeadExternal as jest.Mock).mockResolvedValue(true);

    const mockIo = {} as unknown as Server;
    initializeReportRepositories({} as any, mockIo);
  });

  // addReport
  it('addReport should set status, call add and photos and return mapped DTO', async () => {
    const reportData: any = {
      title: 'T',
      description: 'D',
      photos: ['uploads/1.jpg'],
      user: { id: 7 }
    };

    const addedReportDao = { id: 11, ...reportData, photos: [] };
    mockReportRepository.add.mockResolvedValueOnce(addedReportDao);
    mockReportRepository.addPhotosToReport.mockResolvedValueOnce(true);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(mockReportDTO);

    const res = await addReport(reportData);

    expect(mockReportRepository.add).toHaveBeenCalledTimes(1);
    // after add, addPhotosToReport should be called
    expect(mockReportRepository.addPhotosToReport).toHaveBeenCalledTimes(1);
    expect(res).toEqual(mockReportDTO);
  });

  // updateReportStatus: not found
  it('updateReportStatus should throw REPORT_NOT_FOUND when report missing', async () => {
    mockReportRepository.findById.mockResolvedValueOnce(null);
    const p = updateReportStatus(999, StatusType.Resolved, 'ok');
    await expect(p).rejects.toHaveProperty('message', 'REPORT_NOT_FOUND');
    await expect(p).rejects.toHaveProperty('status', 404);
  });

  // updateReportStatus: success with notification
  it('updateReportStatus should update status, create notification and send via socket', async () => {
    const reportDao: any = {
      id: 5,
      title: 'R',
      status: StatusType.PendingApproval,
      user: { id: 42 }
    };
    const updatedDao: any = { ...reportDao, status: StatusType.Resolved, explanation: 'fix' };

    mockReportRepository.findById.mockResolvedValueOnce(reportDao);
    mockReportRepository.update.mockResolvedValueOnce(updatedDao);
    mockNotificationRepository.add.mockResolvedValueOnce({ id: 77, content: '...' });
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(mockReportDTO);

    const res = await updateReportStatus(reportDao.id, StatusType.Resolved, 'fix');

    expect(mockReportRepository.findById).toHaveBeenCalledWith(reportDao.id);
    expect(mockReportRepository.update).toHaveBeenCalledWith({
      ...reportDao,
      officer: reportDao.officer,
      status: StatusType.Resolved,
      explanation: 'fix'
    });
    expect(mockNotificationRepository.add).toHaveBeenCalledTimes(1);
    expect(mockSocketService.sendNotificationToUser).toHaveBeenCalledWith(reportDao.user.id, { id: 77, content: '...' });
    expect(res).toEqual(mockReportDTO);
  });

  // updateReportOfficer: (internal) - reuse similar patterns as existing tests
  it('updateReportOfficer should assign internal officer and create only officer-user chat', async () => {
    const reportId = 10;
    const reportDao: any = { id: reportId, status: StatusType.PendingApproval, officer: undefined, leadOfficer: undefined, chats: [] };
    const internalOfficer: MunicipalityOfficer = mockTechAgentDAO();
    const techLead: MunicipalityOfficer = mockTechLeadDAO();

    mockReportRepository.findById.mockResolvedValueOnce(reportDao);
    mockReportRepository.update.mockResolvedValueOnce({ ...reportDao, officer: internalOfficer });

    const res = await updateReportOfficer(reportId, internalOfficer, techLead);

    expect(mockReportRepository.findById).toHaveBeenCalledWith(reportId);
    expect(messagingController.createChatOfficerUser).toHaveBeenCalledWith(reportDao);
    expect(messagingController.createChatLeadExternal).not.toHaveBeenCalled();
    expect(mockReportRepository.update).toHaveBeenCalled();
    expect(res).toEqual(mockReportDTO);
  });

  it('updateReportOfficer should assign external officer, set leadOfficer and create both chats', async () => {
    const reportId = 20;
    const reportDao: any = { id: reportId, status: StatusType.PendingApproval, officer: undefined, leadOfficer: undefined, chats: [] };
    const externalOfficer: MunicipalityOfficer = { ...mockTechAgentDAO(), external: true, username: 'ext' };
    const techLead: MunicipalityOfficer = mockTechLeadDAO();

    mockReportRepository.findById.mockResolvedValueOnce(reportDao);
    mockReportRepository.update.mockResolvedValueOnce({ ...reportDao, officer: externalOfficer, leadOfficer: techLead });

    const res = await updateReportOfficer(reportId, externalOfficer, techLead);

    expect(mockReportRepository.findById).toHaveBeenCalledWith(reportId);
    expect(messagingController.createChatOfficerUser).toHaveBeenCalledWith(reportDao);
    expect(messagingController.createChatLeadExternal).toHaveBeenCalledWith(reportDao);
    expect(mockReportRepository.update).toHaveBeenCalled();
    expect(res).toEqual(mockReportDTO);
  });
  it('updateReportOfficer should throw REPORT_NOT_FOUND when no report', async () => {
    mockReportRepository.findById.mockResolvedValueOnce(null);
    const p = updateReportOfficer(999, mockTechAgentDAO(), mockTechLeadDAO());
    await expect(p).rejects.toHaveProperty('message', 'REPORT_NOT_FOUND');
    await expect(p).rejects.toHaveProperty('status', 404);
  });

  // getAllReports
  it('getAllReports should return mapped list', async () => {
    const daoList = [{ id: 1 }, { id: 2 }];
    mockReportRepository.findAll.mockResolvedValueOnce(daoList);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockImplementation((dao: any) => ({ id: dao.id }));

    const res = await getAllReports();
    expect(mockReportRepository.findAll).toHaveBeenCalledTimes(1);
    expect(res).toEqual([{ id: 1 }, { id: 2 }]);
  });

  // getReportById
  it('getReportById should return mapped DTO', async () => {
    const dao = { id: 7 };
    mockReportRepository.findById.mockResolvedValueOnce(dao);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(mockReportDTO);

    const res = await getReportById(7);
    expect(mockReportRepository.findById).toHaveBeenCalledWith(7);
    expect(res).toEqual(mockReportDTO);
  });

  it('getReportById should throw REPORT_NOT_FOUND when not found', async () => {
    mockReportRepository.findById.mockResolvedValueOnce(null);
    await expect(getReportById(999)).rejects.toHaveProperty('message', 'REPORT_NOT_FOUND');
  });

  // GetReportsByOfficerUsername
  it('GetReportsByOfficerUsername should call adminController.getMunicipalityOfficerDAOByUsername and return mapped reports', async () => {
    const officer = mockTechAgentDAO();
    (adminController.getMunicipalityOfficerDAOByUsername as jest.Mock).mockResolvedValueOnce(officer);
    mockReportRepository.findByOfficer.mockResolvedValueOnce([{ id: 33 }]);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(mockReportDTO);

    const res = await GetReportsByOfficerUsername(officer.username);
    expect(adminController.getMunicipalityOfficerDAOByUsername).toHaveBeenCalledWith(officer.username);
    expect(mockReportRepository.findByOfficer).toHaveBeenCalledWith(officer);
    expect(res).toEqual([mockReportDTO]);
  });

  // getAllAcceptedReports
  it('getAllAcceptedReports should return approved reports mapped', async () => {
    mockReportRepository.findApproved.mockResolvedValueOnce([{ id: 5 }]);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(mockReportDTO);

    const res = await getAllAcceptedReports();
    expect(mockReportRepository.findApproved).toHaveBeenCalledTimes(1);
    expect(res).toEqual([mockReportDTO]);
  });

  // getReportsByCategoryIdAndStatus
  it('getReportsByCategoryIdAndStatus should filter by provided statuses', async () => {
    const r1 = { id: 1, status: StatusType.Assigned };
    const r2 = { id: 2, status: StatusType.PendingApproval };
    const r3 = { id: 3, status: StatusType.Resolved };
    mockReportRepository.findByCategoryId.mockResolvedValueOnce([r1, r2, r3]);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockImplementation((dao: any) => ({ id: dao.id }));

    const res = await getReportsByCategoryIdAndStatus(99, [StatusType.Assigned, StatusType.Resolved]);
    expect(mockReportRepository.findByCategoryId).toHaveBeenCalledWith(99);
    expect(res).toEqual([{ id: 1 }, { id: 3 }]);
  });

  // getUserReports
  it('getUserReports should return mapped reports for user', async () => {
    mockReportRepository.findByUserId.mockResolvedValueOnce([{ id: 12 }]);
    (mockMapper.mapReportDAOToDTO as jest.Mock).mockReturnValueOnce(mockReportDTO);

    const res = await getUserReports(55);
    expect(mockReportRepository.findByUserId).toHaveBeenCalledWith(55);
    expect(res).toEqual([mockReportDTO]);
  });
});
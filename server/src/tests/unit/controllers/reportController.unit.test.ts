// src/tests/reportController.unit.test.ts
import {DataSource} from 'typeorm';
import {updateReportOfficer, initializeReportRepositories} from '../../../controllers/reportController';
import {ReportRepository} from '../../../repositories/ReportRepository';
import {NotificationRepository} from '../../../repositories/NotificationRepository';
import {SocketService} from '../../../services/socketService';
import * as mapperService from '../../../services/mapperService';
import * as messagingController from '../../../controllers/messagingController';
import {Server} from 'socket.io';
import {StatusType} from '../../../models/StatusType';
import {MunicipalityOfficer} from '../../../models/MunicipalityOfficer';
import {Report} from '../../../models/Report';
import {ReportResponseDTO} from '../../../models/DTOs/ReportResponseDTO';

// Importiamo i mock DAO/DTO da utils (assumendo che le funzioni DAO siano state create lì)
import {
    mockTechAgentDAO,
    mockReportResponseDTO,
    mockTechLeadDAO
} from '../../utils';


// --- MOCK DEI MODULI ESTERNI ---
jest.mock('../../../repositories/ReportRepository');
jest.mock('../../../repositories/NotificationRepository');
jest.mock('../../../services/socketService');
jest.mock('../../../services/mapperService');
jest.mock('../../../controllers/messagingController'); // Contiene le funzioni createChat...


describe('updateReportOfficer', () => {

    // Dichiarazioni dei mock delle istanze
    let mockReportRepository:  any;
    let mockNotificationRepository: any;
    let mockSocketService:  any;

    // Dati di Test DAO/DTO
    const mockReportDAO: Report = {
        id: 1,
        title: 'Test Report',
        status: StatusType.PendingApproval,
        officer: undefined,
        leadOfficer: undefined
    } as Report;

    const mockReportDTO: ReportResponseDTO = mockReportResponseDTO(1);

    // Officer mockati
    const mockInternalOfficer: MunicipalityOfficer = mockTechAgentDAO();
    const mockExternalOfficer: MunicipalityOfficer = {
        ...mockTechAgentDAO(),
        external: true,
        username: 'external_agent'
    };
    const mockTechLead: MunicipalityOfficer = mockTechLeadDAO();

    beforeEach(() => {
        jest.clearAllMocks();

        mockReportRepository = {
            findById: jest.fn(),
            update: jest.fn(),
        };
        mockNotificationRepository = {};
        mockSocketService = {
            sendNotificationToUser: jest.fn(),
        };

        (ReportRepository as unknown as jest.Mock).mockImplementation(() => mockReportRepository);
        (NotificationRepository as unknown as jest.Mock).mockImplementation(() => mockNotificationRepository);
        (SocketService as unknown as jest.Mock).mockImplementation(() => mockSocketService);


        // Mock dei servizi
        (mapperService.mapReportDAOToDTO as jest.Mock).mockReturnValue(mockReportDTO);
        (messagingController.createChatOfficerUser as jest.Mock).mockResolvedValue(true);
        (messagingController.createChatLeadExternal as jest.Mock).mockResolvedValue(true);

        const mockIo = {} as unknown as Server; // Mock per il server Socket.io
        initializeReportRepositories({} as any, mockIo);

        // Reset dello stato del DAO di riferimento (per evitare modifiche tra i test)
        mockReportDAO.officer = undefined;
        mockReportDAO.leadOfficer = undefined;
    });

    // Test Case 1: Report non trovato
    it('dovrebbe lanciare REPORT_NOT_FOUND se il report non esiste', async () => {

        // findById non trova nulla
        mockReportRepository.findById.mockResolvedValue(null);

        const reportId = 99;

        const executionPromise = updateReportOfficer(reportId, mockInternalOfficer, mockTechLead);

        // Asserzioni sul risultato
        await expect(executionPromise).rejects.toHaveProperty('message', 'REPORT_NOT_FOUND');
        await expect(executionPromise).rejects.toHaveProperty('status', 404);

        // Asserzioni sul conteggio
        expect(mockReportRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockReportRepository.findById).toHaveBeenCalledWith(reportId);
        expect(mockReportRepository.update).not.toHaveBeenCalled();
    });

    // Test Case 2: Assegnazione a un Officer INTERNO
    it('dovrebbe assegnare il report all\'officer interno e creare SOLO la chat Officer-User', async () => {

        const reportId = 1;

        // findById trova il report
        mockReportRepository.findById.mockResolvedValue(mockReportDAO);
        // L'update restituisce il DAO aggiornato
        mockReportRepository.update.mockResolvedValue({
            ...mockReportDAO,
            officer: mockInternalOfficer,
            leadOfficer: undefined // Deve essere undefined per officer interni
        });

        const result = await updateReportOfficer(reportId, mockInternalOfficer, mockTechLead);

        // Asserzioni
        expect(mockReportRepository.findById).toHaveBeenCalledWith(reportId);

        // Verifica che il reportDAO sia stato aggiornato correttamente prima dell'update
        const expectedUpdatedDao = {
            ...mockReportDAO,
            officer: mockInternalOfficer,
            leadOfficer: undefined // Nessun lead officer per interni
        };
        expect(mockReportRepository.update).toHaveBeenCalledWith(expectedUpdatedDao);

        // Asserzioni Logica di Chat
        expect(messagingController.createChatOfficerUser).toHaveBeenCalledTimes(1);
        expect(messagingController.createChatOfficerUser).toHaveBeenCalledWith(reportId);
        expect(messagingController.createChatLeadExternal).not.toHaveBeenCalled();

        // Asserzioni DTO di Ritorno
        expect(mapperService.mapReportDAOToDTO).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockReportDTO);
    });

    // Test Case 3: Assegnazione a un Officer ESTERNO
    it('dovrebbe assegnare il report all\'officer esterno, assegnare il Tech Lead e creare ENTRAMBE le chat', async () => {

        const reportId = 1;

        // findById trova il report
        mockReportRepository.findById.mockResolvedValue(mockReportDAO);
        // L'update restituisce il DAO aggiornato
        mockReportRepository.update.mockResolvedValue({
            ...mockReportDAO,
            officer: mockExternalOfficer,
            leadOfficer: mockTechLead
        });

        // Esecuzione
        const result = await updateReportOfficer(reportId, mockExternalOfficer, mockTechLead);


        // Verifica che il reportDAO sia stato aggiornato correttamente (officer + leadOfficer)
        const expectedUpdatedDao = {
            ...mockReportDAO,
            officer: mockExternalOfficer,
            leadOfficer: mockTechLead
        };
        expect(mockReportRepository.update).toHaveBeenCalledWith(expectedUpdatedDao);

        // Asserzioni Logica di Chat
        expect(messagingController.createChatOfficerUser).toHaveBeenCalledTimes(1);
        expect(messagingController.createChatOfficerUser).toHaveBeenCalledWith(reportId);
        expect(messagingController.createChatLeadExternal).toHaveBeenCalledTimes(1);
        expect(messagingController.createChatLeadExternal).toHaveBeenCalledWith(reportId);

        // Asserzioni DTO di Ritorno
        expect(result).toEqual(mockReportDTO);
    });
});
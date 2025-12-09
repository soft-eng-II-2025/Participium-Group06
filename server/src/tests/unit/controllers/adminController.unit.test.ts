import {assignTechAgent, initializeAdminRepositories} from '../../../controllers/adminController';
import {updateReportOfficer} from '../../../controllers/reportController';
import {
    mockTechLeadDAO,
    mockTechAgentDAO,
    mockReportResponseDTO,
    mockOfficerResponseDTO,
    mockUserResponseDTO,
    mockChatResponseDTOs
} from '../../utils';
import {MunicipalityOfficerRepository} from "../../../repositories/MunicipalityOfficerRepository";
import {RoleRepository} from "../../../repositories/RoleRepository";
import {CategoryRepository} from "../../../repositories/CategoryRepository";
import {ReportRepository} from "../../../repositories/ReportRepository";


// --- MOCK delle Dipendenze ---
jest.mock('../../../controllers/reportController');
jest.mock("../../../repositories/MunicipalityOfficerRepository");
jest.mock("../../../repositories/RoleRepository");
jest.mock("../../../repositories/CategoryRepository");
jest.mock("../../../repositories/ReportRepository");


describe('assignTechAgent', () => {
    let mockReportController: any;
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
            mockReportController = {
                updateReportOfficer: jest.fn()
            };
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


        }
    )


    afterEach(() => {
            jest.clearAllMocks();
        }
    )


    // Test Case 1: Assegnazione riuscita
    it('dovrebbe assegnare il report all\'officer e tech lead e ritornare il ReportResponseDTO', async () => {


        // Setup dei mock:
        mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
        mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockTechLead);


        const reportId = 1;
        const officerUsername = mockOfficer.username;
        const techLeadUsername = mockTechLead.username;


        // Esecuzione
        const result = await assignTechAgent(reportId, officerUsername, techLeadUsername);


        // Asserzioni
        expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledTimes(2);
        expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledWith(officerUsername);
        expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledWith(techLeadUsername);


        expect(updateReportOfficer).toHaveBeenCalledTimes(1);
        expect(updateReportOfficer).toHaveBeenCalledWith(reportId, mockOfficer, mockTechLead);


        expect(result).toEqual(expectedReportDTO);
    });


    // Test Case 2: Tech Lead non trovato
    it('dovrebbe lanciare un errore 404 se il Tech Lead non è trovato', async () => {

        // Setup dei mock: Trova l'Officer, ma NON il Tech Lead
        mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockOfficer);
        mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null);


        // Esecuzione & Asserzione
        const executionPromise = assignTechAgent(1, mockOfficer.username, mockTechLead.username);

        // Asserzioni sul risultato della Promise
        await expect(executionPromise).rejects.toHaveProperty('message', 'TECH_LEAD_NOT_FOUND');
        await expect(executionPromise).rejects.toHaveProperty('status', 404)

        expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledTimes(2);
        expect(updateReportOfficer).not.toHaveBeenCalled();
    });


    // Test Case 3: L'Officer non trovato
    it('dovrebbe lanciare un errore 404 se l\'Officer non è trovato (test order of checks)', async () => {


        // Setup dei mock: NON trova l'Officer, ma trova il Tech Lead.
        mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(null); // -> officer
        mockMunicipalityOfficerRepository.findByUsername.mockResolvedValueOnce(mockTechLead); // -> techLead


        // Esecuzione & Asserzione
        // Esecuzione & Asserzione
        const executionPromise = assignTechAgent(1, mockOfficer.username, mockTechLead.username);

        // Asserzioni sul risultato della Promise
        await expect(executionPromise).rejects.toHaveProperty('message', 'OFFICER_NOT_FOUND');
        await expect(executionPromise).rejects.toHaveProperty('status', 404)


        expect(mockMunicipalityOfficerRepository.findByUsername).toHaveBeenCalledTimes(2);
        expect(updateReportOfficer).not.toHaveBeenCalled();
    });
});


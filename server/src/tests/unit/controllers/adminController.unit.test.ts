// src/tests/unit/adminController.unit.test.ts

import {
    initializeAdminRepositories,
    addMunicipalityOfficer,
    getAllMunicipalityOfficer,
    updateMunicipalityOfficer,
    loginOfficer,
    getAllRoles,
    getMunicipalityOfficerByUsername,
    assignTechAgent,
    getAgentsByTechLeadId,
    getTechReports,
    getTechLeadReports,
} from "../../../controllers/adminController";

import { MunicipalityOfficerRepository } from "../../../repositories/MunicipalityOfficerRepository";
import { RoleRepository } from "../../../repositories/RoleRepository";
import {
    mapMunicipalityOfficerDAOToDTO as mapMunicipalityOfficerDAOToResponse,
    mapReportDAOToDTO as mapReportDAOToResponse,
} from "../../../services/mapperService";
import { verifyPassword, hashPassword } from "../../../services/passwordService";
import { StatusType } from "../../../models/StatusType";

// mock di reportController per le funzioni richiamate da adminController
jest.mock("../../../controllers/reportController", () => ({
    updateReportOfficer: jest.fn(),
    getReportsByCategoryIdAndStatus: jest.fn(),
}));

import {
    updateReportOfficer,
    getReportsByCategoryIdAndStatus,
} from "../../../controllers/reportController";

// mock repository e servizi
jest.mock("../../../repositories/MunicipalityOfficerRepository");
jest.mock("../../../repositories/RoleRepository");
jest.mock("../../../services/mapperService");
jest.mock("../../../services/passwordService");

describe("adminController - unit test (solo mock)", () => {
    let officerRepoMock: any;
    let roleRepoMock: any;

    beforeEach(() => {
        officerRepoMock = {
            add: jest.fn(),
            findAllVisible: jest.fn(),
            findByUsername: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findByRoleTitle: jest.fn(),
        };

        roleRepoMock = {
            findByTitle: jest.fn(),
            findAssignable: jest.fn(),
        };

        (MunicipalityOfficerRepository as unknown as jest.Mock).mockImplementation(
            () => officerRepoMock
        );
        (RoleRepository as unknown as jest.Mock).mockImplementation(
            () => roleRepoMock
        );

        // inizializza i repo interni del controller con un dataSource finto
        initializeAdminRepositories({} as any);

        jest.clearAllMocks();
    });

    // ------------------------------------------------------------------
    // addMunicipalityOfficer
    // ------------------------------------------------------------------
    describe("addMunicipalityOfficer", () => {
        it("dovrebbe aggiungere un nuovo ufficiale", async () => {
            const dao = { id: 1, username: "new.officer", email: "new@example.com" };
            (hashPassword as jest.Mock).mockResolvedValue("hashedpass");
            officerRepoMock.add.mockResolvedValue(dao);
            (mapMunicipalityOfficerDAOToResponse as jest.Mock).mockReturnValue({
                username: "new.officer",
                email: "new@example.com",
                role: null,
            });

            const result = await addMunicipalityOfficer({
                username: "new.officer",
                email: "new@example.com",
                password: "securepass",
                first_name: "New",
                last_name: "Officer",
            });

            expect(hashPassword).toHaveBeenCalledWith("securepass");
            expect(officerRepoMock.add).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                username: "new.officer",
                email: "new@example.com",
                role: null,
            });
        });

        it("dovrebbe lanciare PASSWORD_REQUIRED se la password è vuota", async () => {
            await expect(
                addMunicipalityOfficer({
                    username: "failuser",
                    email: "fail@example.com",
                    password: "",
                    first_name: "Fail",
                    last_name: "User",
                }),
            ).rejects.toThrow("PASSWORD_REQUIRED");
        });

        it("può simulare violazione di vincolo (username duplicato)", async () => {
            (hashPassword as jest.Mock).mockResolvedValue("hashedpass");
            officerRepoMock.add.mockRejectedValue(new Error("duplicate key"));

            await expect(
                addMunicipalityOfficer({
                    username: "regular.officer",
                    email: "unique@example.com",
                    password: "securepass",
                    first_name: "Dup",
                    last_name: "User",
                }),
            ).rejects.toThrow("duplicate key");
        });
    });

    // ------------------------------------------------------------------
    // getAllMunicipalityOfficer
    // ------------------------------------------------------------------
    describe("getAllMunicipalityOfficer", () => {
        it("dovrebbe restituire gli ufficiali visibili (escluso admin)", async () => {
            const daoList = [
                { username: "regular.officer" },
                { username: "assignme.officer" },
            ];
            officerRepoMock.findAllVisible.mockResolvedValue(daoList);
            (mapMunicipalityOfficerDAOToResponse as jest.Mock)
                .mockImplementation(dao => ({ username: dao.username }));

            const officers = await getAllMunicipalityOfficer();

            expect(officerRepoMock.findAllVisible).toHaveBeenCalledTimes(1);
            expect(officers).toEqual([
                { username: "regular.officer" },
                { username: "assignme.officer" },
            ]);
        });

        it("dovrebbe restituire array vuoto se non ci sono ufficiali visibili", async () => {
            officerRepoMock.findAllVisible.mockResolvedValue([]);

            const officers = await getAllMunicipalityOfficer();

            expect(officers).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // updateMunicipalityOfficer
    // ------------------------------------------------------------------
    describe("updateMunicipalityOfficer", () => {
        it("aggiorna il ruolo di un ufficiale con successo", async () => {
            const existingOfficer = { username: "assignme.officer", role: null };
            const role = { id: 10, title: "Supervisor" };

            officerRepoMock.findByUsername.mockResolvedValue(existingOfficer);
            roleRepoMock.findByTitle.mockResolvedValue(role);
            officerRepoMock.update.mockResolvedValue({ ...existingOfficer, role });
            (mapMunicipalityOfficerDAOToResponse as jest.Mock).mockReturnValue({
                username: "assignme.officer",
                role: "Supervisor",
            });

            const result = await updateMunicipalityOfficer({
                username: "assignme.officer",
                roleTitle: "Supervisor",
            });

            expect(officerRepoMock.findByUsername).toHaveBeenCalledWith("assignme.officer");
            expect(roleRepoMock.findByTitle).toHaveBeenCalledWith("Supervisor");
            expect(result).toEqual({
                username: "assignme.officer",
                role: "Supervisor",
            });
        });

        it("lancia USERNAME_REQUIRED se username è vuoto", async () => {
            await expect(
                updateMunicipalityOfficer({ username: "", roleTitle: "Officer" }),
            ).rejects.toThrow("USERNAME_REQUIRED");
        });

        it("lancia OFFICER_NOT_FOUND se l'ufficiale non esiste", async () => {
            officerRepoMock.findByUsername.mockResolvedValue(null);

            await expect(
                updateMunicipalityOfficer({ username: "nonexistent", roleTitle: "Officer" }),
            ).rejects.toThrow("OFFICER_NOT_FOUND");
        });

        it("lancia ROLE_ALREADY_ASSIGNED se l'ufficiale ha già un ruolo", async () => {
            officerRepoMock.findByUsername.mockResolvedValue({
                username: "regular.officer",
                role: { title: "Officer" },
            });

            await expect(
                updateMunicipalityOfficer({
                    username: "regular.officer",
                    roleTitle: "Officer",
                }),
            ).rejects.toThrow("ROLE_ALREADY_ASSIGNED");
        });

        it("lancia ROLE_TITLE_REQUIRED se roleTitle è mancante", async () => {
            officerRepoMock.findByUsername.mockResolvedValue({
                username: "assignme.officer",
                role: null,
            });

            await expect(
                updateMunicipalityOfficer({
                    username: "assignme.officer",
                    roleTitle: "",
                }),
            ).rejects.toThrow("ROLE_TITLE_REQUIRED");
        });

        it("lancia ROLE_NOT_FOUND se il ruolo non esiste", async () => {
            officerRepoMock.findByUsername.mockResolvedValue({
                username: "assignme.officer",
                role: null,
            });
            roleRepoMock.findByTitle.mockResolvedValue(null);

            await expect(
                updateMunicipalityOfficer({
                    username: "assignme.officer",
                    roleTitle: "NonExistentRole",
                }),
            ).rejects.toThrow("ROLE_NOT_FOUND");
        });

        it("lancia ROLE_NOT_ASSIGNABLE se si prova ad assegnare Admin", async () => {
            officerRepoMock.findByUsername.mockResolvedValue({
                username: "assignme.officer",
                role: null,
            });

            await expect(
                updateMunicipalityOfficer({
                    username: "assignme.officer",
                    roleTitle: "Admin",
                }),
            ).rejects.toThrow("ROLE_NOT_ASSIGNABLE");
        });

        it('lancia FORBIDDEN_ADMIN_ACCOUNT se si tenta di modificare l\'utente "admin"', async () => {
            await expect(
                updateMunicipalityOfficer({
                    username: "admin",
                    roleTitle: "Officer",
                }),
            ).rejects.toThrow("FORBIDDEN_ADMIN_ACCOUNT");
        });
    });

    // ------------------------------------------------------------------
    // loginOfficer
    // ------------------------------------------------------------------
    describe("loginOfficer", () => {
        it("login ok con credenziali valide", async () => {
            const dao = { username: "regular.officer", password: "hashed" };
            officerRepoMock.findByUsername.mockResolvedValue(dao);
            (verifyPassword as jest.Mock).mockResolvedValue(true);
            (mapMunicipalityOfficerDAOToResponse as jest.Mock).mockReturnValue({
                username: "regular.officer",
            });

            const res = await loginOfficer({
                username: "regular.officer",
                password: "securepassword",
            });

            expect(res).toEqual({ username: "regular.officer" });
            expect(officerRepoMock.findByUsername).toHaveBeenCalledWith("regular.officer");
            expect(verifyPassword).toHaveBeenCalled();
        });

        it("lancia INVALID_CREDENTIALS se la password è errata", async () => {
            const dao = { username: "regular.officer", password: "hashed" };
            officerRepoMock.findByUsername.mockResolvedValue(dao);
            (verifyPassword as jest.Mock).mockResolvedValue(false);

            await expect(
                loginOfficer({
                    username: "regular.officer",
                    password: "wrongpassword",
                }),
            ).rejects.toThrow("INVALID_CREDENTIALS");
        });
    });

    // ------------------------------------------------------------------
    // getAllRoles
    // ------------------------------------------------------------------
    describe("getAllRoles", () => {
        it("restituisce solo ruoli assegnabili (no Admin)", async () => {
            roleRepoMock.findAssignable.mockResolvedValue([
                { id: 1, title: "Officer", label: "Officer" },
                { id: 2, title: "Viewer", label: "Viewer" },
            ]);

            const roles = await getAllRoles();

            expect(roleRepoMock.findAssignable).toHaveBeenCalledTimes(1);
            expect(roles).toEqual([
                { id: 1, title: "Officer", label: "Officer" },
                { id: 2, title: "Viewer", label: "Viewer" },
            ]);
        });

        it("ritorna array vuoto se non ci sono ruoli", async () => {
            roleRepoMock.findAssignable.mockResolvedValue([]);
            const roles = await getAllRoles();
            expect(roles).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // getMunicipalityOfficerByUsername
    // ------------------------------------------------------------------
    describe("getMunicipalityOfficerByUsername", () => {
        it("restituisce l'ufficiale se esiste", async () => {
            const dao = { username: "regular.officer", role: { title: "Officer" } };
            officerRepoMock.findByUsername.mockResolvedValue(dao);
            (mapMunicipalityOfficerDAOToResponse as jest.Mock).mockReturnValue({
                username: "regular.officer",
                role: "Officer",
            });

            const dto = await getMunicipalityOfficerByUsername("regular.officer");
            expect(dto).toEqual({ username: "regular.officer", role: "Officer" });
        });

        it("lancia OFFICER_NOT_FOUND se non esiste", async () => {
            officerRepoMock.findByUsername.mockResolvedValue(null);

            await expect(
                getMunicipalityOfficerByUsername("nonexistent.officer"),
            ).rejects.toThrow("OFFICER_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // assignTechAgent
    // ------------------------------------------------------------------
    describe("assignTechAgent", () => {
        it("assegna un tech agent a un report", async () => {
            const officer = { id: 10, username: "tech.agent1" };
            officerRepoMock.findById.mockResolvedValue(officer);

            (updateReportOfficer as jest.Mock).mockResolvedValue({
                id: 123,
                officer: { username: "tech.agent1" },
            });

            const result = await assignTechAgent(123, 10);

            expect(officerRepoMock.findById).toHaveBeenCalledWith(10);
            expect(updateReportOfficer).toHaveBeenCalledWith(123, officer);
            expect(result.officer.username).toBe("tech.agent1");
        });

        it("lancia OFFICER_NOT_FOUND se il tech agent non esiste", async () => {
            officerRepoMock.findById.mockResolvedValue(null);

            await expect(assignTechAgent(123, 99999)).rejects.toThrow("OFFICER_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // getAgentsByTechLeadId
    // ------------------------------------------------------------------
    describe("getAgentsByTechLeadId", () => {
        it("restituisce tutti i tech agent per un tech lead valido", async () => {
            const techLead = { id: 1, role: { title: "TECH_LEAD_AREA1" } };
            officerRepoMock.findById.mockResolvedValue(techLead);

            const agents = [{ username: "tech.agent1" }, { username: "tech.agent2" }];
            officerRepoMock.findByRoleTitle.mockResolvedValue(agents);

            (mapMunicipalityOfficerDAOToResponse as jest.Mock)
                .mockImplementation(o => ({ username: o.username }));

            const result = await getAgentsByTechLeadId(1);

            expect(officerRepoMock.findById).toHaveBeenCalledWith(1);
            expect(officerRepoMock.findByRoleTitle).toHaveBeenCalledWith("TECH_AGENT_AREA1");
            expect(result).toEqual([
                { username: "tech.agent1" },
                { username: "tech.agent2" },
            ]);
        });

        it("lancia OFFICER_NOT_FOUND se il tech lead non esiste", async () => {
            officerRepoMock.findById.mockResolvedValue(null);

            await expect(getAgentsByTechLeadId(99999)).rejects.toThrow("OFFICER_NOT_FOUND");
        });

        it("lancia INVALID_TECH_LEAD_LABEL se il ruolo non è TECH_LEAD", async () => {
            officerRepoMock.findById.mockResolvedValue({
                id: 2,
                role: { title: "Officer" },
            });

            await expect(getAgentsByTechLeadId(2)).rejects.toThrow(
                "INVALID_TECH_LEAD_LABEL",
            );
        });
    });

    // ------------------------------------------------------------------
    // getTechReports
    // ------------------------------------------------------------------
    describe("getTechReports", () => {
        it("restituisce i report assegnati al tech agent", async () => {
            const officer = {
                id: 1,
                reports: [{ id: 1, title: "R1" }, { id: 2, title: "R2" }],
            };
            officerRepoMock.findById.mockResolvedValue(officer);

            (mapReportDAOToResponse as jest.Mock).mockImplementation(r => ({
                id: r.id,
                title: r.title,
            }));

            const res = await getTechReports(1);

            expect(officerRepoMock.findById).toHaveBeenCalledWith(1);
            expect(res).toEqual([
                { id: 1, title: "R1" },
                { id: 2, title: "R2" },
            ]);
        });

        it("lancia OFFICER_NOT_FOUND se il tech agent non esiste", async () => {
            officerRepoMock.findById.mockResolvedValue(null);

            await expect(getTechReports(99999)).rejects.toThrow("OFFICER_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // getTechLeadReports
    // ------------------------------------------------------------------
    describe("getTechLeadReports", () => {
        it("restituisce tutti i report delle categorie del tech lead con status validi", async () => {
            const officer = {
                id: 1,
                role: {
                    categories: [{ id: 10 }, { id: 20 }],
                },
            };
            officerRepoMock.findById.mockResolvedValue(officer);

            (getReportsByCategoryIdAndStatus as jest.Mock)
                .mockResolvedValueOnce([{ id: 100 }, { id: 101 }]) // cat 10
                .mockResolvedValueOnce([{ id: 200 }]);             // cat 20

            const res = await getTechLeadReports(1);

            expect(officerRepoMock.findById).toHaveBeenCalledWith(1);
            expect(getReportsByCategoryIdAndStatus).toHaveBeenCalledTimes(2);
            expect(res).toEqual([{ id: 100 }, { id: 101 }, { id: 200 }]);
        });

        it("lancia OFFICER_NOT_FOUND se il tech lead non esiste", async () => {
            officerRepoMock.findById.mockResolvedValue(null);

            await expect(getTechLeadReports(99999)).rejects.toThrow("OFFICER_NOT_FOUND");
        });
    });
});

import { TestDataSource } from '../../test-data-source';
import { DataSource, Repository } from 'typeorm';

import * as userController from '../../../controllers/userController';
import { UserRepository } from '../../../repositories/UserRepository';

import { CreateUserRequestDTO } from '../../../models/DTOs/CreateUserRequestDTO';







import {
    createUser,
    updateUser,
    loginUser,
    getUserByUsername,
    getUserIdByUsername,
    getAllCategories,
    initializeUserRepositories,
} from "../../../controllers/userController";

import { CategoryRepository } from "../../../repositories/CategoryRepository";
import { hashPassword, verifyPassword } from "../../../services/passwordService";
import { mapUserDAOToDTO as mapUserDAOToResponse, mapCategoryDAOToDTO } from "../../../services/mapperService";

// Mock Repository e Services
jest.mock("../../../repositories/UserRepository");
jest.mock("../../../repositories/CategoryRepository");
jest.mock("../../../services/passwordService");
jest.mock("../../../services/mapperService");

describe("userController - Unit Test (Mocking)", () => {
    let userRepoMock: any;
    let categoryRepoMock: any;

    // DAO e DTO di esempio
    const mockUserDao = { id: 1, username: "testuser", email: "test@example.com", password: "hashed_password" };
    const mockUserDto = { userId: 1, username: "testuser", email: "test@example.com" };
    const mockCategoryDao = [{ id: 1, name: "Roads" }, { id: 2, name: "Waste" }];
    const mockCategoryDto = [{ id: 1, name: "Roads" }];


    beforeEach(() => {
        userRepoMock = {
            add: jest.fn().mockResolvedValue(mockUserDao),
            findByUsername: jest.fn().mockResolvedValue(null),
            findByEmail: jest.fn().mockResolvedValue(null),
            changePhoto: jest.fn().mockResolvedValue(mockUserDao),
            changeTelegramId: jest.fn().mockResolvedValue(mockUserDao),
            changeFlagEmail: jest.fn().mockResolvedValue(mockUserDao),
        };

        categoryRepoMock = {
            findAll: jest.fn().mockResolvedValue(mockCategoryDao),
        };

        // Simula l'inizializzazione dei repository
        (UserRepository as unknown as jest.Mock).mockImplementation(() => userRepoMock);
        (CategoryRepository as unknown as jest.Mock).mockImplementation(() => categoryRepoMock);
        initializeUserRepositories({} as any);

        // Mock dei servizi di mappatura e password
        (mapUserDAOToResponse as jest.Mock).mockReturnValue(mockUserDto);
        (hashPassword as jest.Mock).mockResolvedValue("hashed_password");
        (verifyPassword as jest.Mock).mockResolvedValue(true);
        (mapCategoryDAOToDTO as jest.Mock).mockImplementation((dao: any) => ({
            id: dao.id,
            name: dao.name,
        }));

        jest.clearAllMocks();
        (mapUserDAOToResponse as jest.Mock).mockReturnValue(mockUserDto);
    });

    // ------------------------------------------------------------------
    // createUser
    // ------------------------------------------------------------------
    describe("createUser", () => {
        const userData = {
            username: "newuser",
            email: "new@example.com",
            password: "securepass",
            first_name: "New",
            last_name: "User",
        };

        it("dovrebbe creare un nuovo utente con successo", async () => {
            const result = await createUser(userData);

            expect(hashPassword).toHaveBeenCalledWith("securepass");
            expect(userRepoMock.add).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockUserDto);
        });

        it("dovrebbe lanciare USERNAME_TAKEN se l'username esiste già", async () => {
            userRepoMock.findByUsername.mockResolvedValue(mockUserDao); // Simula che l'username esista

            await expect(createUser(userData)).rejects.toThrow("USERNAME_TAKEN");
            expect(userRepoMock.add).not.toHaveBeenCalled();
        });

        it("dovrebbe lanciare EMAIL_TAKEN se l'email esiste già", async () => {
            userRepoMock.findByEmail.mockResolvedValue(mockUserDao); // Simula che l'email esista

            await expect(createUser(userData)).rejects.toThrow("EMAIL_TAKEN");
            expect(userRepoMock.add).not.toHaveBeenCalled();
        });

        it("dovrebbe lanciare PASSWORD_REQUIRED se la password è mancante", async () => {
            await expect(createUser({ ...userData, password: "" })).rejects.toThrow("PASSWORD_REQUIRED");
            expect(userRepoMock.add).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------
    // updateUser
    // ------------------------------------------------------------------
    describe("updateUser", () => {
        beforeEach(() => {
            userRepoMock.findByUsername.mockResolvedValue(mockUserDao); // Utente esistente per l'update
        });

        it("dovrebbe aggiornare solo la foto", async () => {
            const updateData = { photo: "new_photo.jpg" };
            await updateUser("testuser", updateData);

            expect(userRepoMock.changePhoto).toHaveBeenCalledWith(mockUserDao, "new_photo.jpg");
            expect(userRepoMock.changeTelegramId).not.toHaveBeenCalled();
            expect(userRepoMock.changeFlagEmail).not.toHaveBeenCalled();
        });

        it("dovrebbe aggiornare tutti i campi forniti", async () => {
            const updateData = {
                photo: "p.jpg",
                telegram_id: "tg_id",
                flag_email: true
            };
            await updateUser("testuser", updateData);

            expect(userRepoMock.changePhoto).toHaveBeenCalledWith(mockUserDao, "p.jpg");
            expect(userRepoMock.changeTelegramId).toHaveBeenCalledWith(mockUserDao, "tg_id");
            expect(userRepoMock.changeFlagEmail).toHaveBeenCalledWith(mockUserDao, true);
        });

        it("dovrebbe lanciare USER_NOT_FOUND se l'utente non esiste", async () => {
            userRepoMock.findByUsername.mockResolvedValueOnce(null); // per il primo find
            await expect(updateUser("nonexistent", {})).rejects.toThrow("USER_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // loginUser
    // ------------------------------------------------------------------
    describe("loginUser", () => {
        const loginData = { username: "testuser", password: "securepass" };

        it("dovrebbe eseguire il login con successo", async () => {
            userRepoMock.findByUsername.mockResolvedValue(mockUserDao);
            (verifyPassword as jest.Mock).mockResolvedValue(true);

            const result = await loginUser(loginData);

            expect(userRepoMock.findByUsername).toHaveBeenCalledWith("testuser");
            expect(verifyPassword).toHaveBeenCalledWith(mockUserDao.password, "securepass");
            expect(result).toEqual(mockUserDto);
        });

        it("dovrebbe lanciare INVALID_CREDENTIALS se la password è errata", async () => {
            userRepoMock.findByUsername.mockResolvedValue(mockUserDao);
            (verifyPassword as jest.Mock).mockResolvedValue(false); // Password errata

            await expect(loginUser(loginData)).rejects.toThrow("INVALID_CREDENTIALS");
        });

        it("dovrebbe lanciare MISSING_CREDENTIALS se manca l'username", async () => {
            await expect(loginUser({ username: "", password: "p" })).rejects.toThrow("MISSING_CREDENTIALS");
        });
    });

    // ------------------------------------------------------------------
    // getUserByUsername & getUserIdByUsername
    // ------------------------------------------------------------------
    describe("getUserByUsername & getUserIdByUsername", () => {
        it("dovrebbe trovare l'utente per username", async () => {
            userRepoMock.findByUsername.mockResolvedValue(mockUserDao);
            const dto = await getUserByUsername("testuser");
            expect(dto).toEqual(mockUserDto);

            const id = await getUserIdByUsername("testuser");
            expect(id).toBe(mockUserDao.id);
        });

        it("dovrebbe lanciare USER_NOT_FOUND", async () => {
            userRepoMock.findByUsername.mockResolvedValue(null);
            await expect(getUserByUsername("nonexistent")).rejects.toThrow("USER_NOT_FOUND");
            await expect(getUserIdByUsername("nonexistent")).rejects.toThrow("USER_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // getAllCategories
    // ------------------------------------------------------------------
    describe("getAllCategories", () => {
        it("dovrebbe restituire tutte le categorie mappate", async () => {
            const result = await getAllCategories();

            expect(categoryRepoMock.findAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([
                { id: 1, name: "Roads" },
                { id: 2, name: "Waste" }
            ]);
            expect(mapCategoryDAOToDTO).toHaveBeenCalledTimes(mockCategoryDao.length);
        });
    });
});

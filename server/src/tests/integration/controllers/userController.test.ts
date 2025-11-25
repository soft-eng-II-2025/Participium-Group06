// src/tests/integration/userController.test.ts
import {TestDataSource} from '../../test-data-source';
import {Repository} from 'typeorm';

import * as userController from '../../../controllers/userController';
import {CreateUserRequestDTO} from '../../../models/DTOs/CreateUserRequestDTO';
import {LoginRequestDTO} from '../../../models/DTOs/LoginRequestDTO';
import {User} from '../../../models/User';
import {Category} from '../../../models/Category';
import {hashPassword} from '../../../services/passwordService';



describe('userController (Integration Tests - DB in Memory)', () => {
    let userRepository: Repository<User>;
    let categoryRepository: Repository<Category>;
    let testUser: User;
    let testCategory: Category;

    // viene eseguito prima di OGNI singolo test
    beforeEach(async () => {
        // Distrugge e reinizializza il DataSource per ogni test
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
        await TestDataSource.initialize();


        // Inizializza i repository del controller con il TestDataSource
        userController.initializeUserRepositories(TestDataSource);

        // Istanzia i repository direttamente con TestDataSource per uso nei test (per pre-popolazione e verifica)
        userRepository = TestDataSource.getRepository(User);
        categoryRepository = TestDataSource.getRepository(Category);


        // Prepara dati di base per i test
        const user = new User();
        user.username = 'existinguser';
        user.email = 'existing@example.com';
        user.password = await hashPassword('password123');
        user.first_name = 'Existing';
        user.last_name = 'User';
        user.photo = "";
        user.telegram_id= "";
        user.flag_email = false;
        testUser = await userRepository.save(user);

        const category = new Category();
        category.name = 'Incidente';
        testCategory = await categoryRepository.save(category);

    });

    // --- Test per createUser ---
    describe('createUser', () => {
        it('dovrebbe creare un nuovo utente con successo', async () => {
            const userData: CreateUserRequestDTO = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'securepassword',
                first_name: 'New',
                last_name: 'User',
            };

            const newUserDTO = await userController.createUser(userData);

            expect(newUserDTO).toBeDefined();
            expect(newUserDTO.username).toBe('newuser');
            expect(newUserDTO.email).toBe('new@example.com');


            const savedUser = await userRepository.findOneBy({username: 'newuser'}); // Usa findOneBy dal repository diretto
            expect(savedUser).toBeDefined();
            expect(savedUser?.email).toBe('new@example.com');
            // Verifichiamo che la password salvata sia corretta usando il login
            const loginCheckDTO = await userController.loginUser({
                username: savedUser?.username || '',
                password: 'securepassword'
            });
            expect(loginCheckDTO).toBeDefined();
            expect(loginCheckDTO.username).toBe('newuser');
        });

        it('dovrebbe lanciare un errore se la password è vuota', async () => {
            const userData: CreateUserRequestDTO = {
                username: 'failuser',
                email: 'fail@example.com',
                password: '', // Password vuota
                first_name: 'Fail',
                last_name: 'User',
            };
            await expect(userController.createUser(userData)).rejects.toThrow('PASSWORD_REQUIRED');
        });

        it('dovrebbe lanciare un errore se lo username è già stato preso', async () => {
            const userData: CreateUserRequestDTO = {
                username: 'existinguser', // Username già presente dal beforeEach
                email: 'another@example.com',
                password: 'securepassword',
                first_name: 'Another',
                last_name: 'User',
            };
            await expect(userController.createUser(userData)).rejects.toThrow('USERNAME_TAKEN');
        });

        it('dovrebbe lanciare un errore se l\'email è già stata presa', async () => {
            const userData: CreateUserRequestDTO = {
                username: 'anotheruser',
                email: 'existing@example.com', // Email già presente dal beforeEach
                password: 'securepassword',
                first_name: 'Another',
                last_name: 'User',
            };
            await expect(userController.createUser(userData)).rejects.toThrow('EMAIL_TAKEN');
        });
    });

    // --- Test per loginUser ---
    describe('loginUser', () => {
        it('dovrebbe effettuare il login con successo con credenziali valide', async () => {
            const loginData: LoginRequestDTO = {
                username: 'existinguser',
                password: 'password123',
            };

            const loggedInUserDTO = await userController.loginUser(loginData);

            expect(loggedInUserDTO).toBeDefined();
            expect(loggedInUserDTO.username).toBe('existinguser');

        });

        it('dovrebbe lanciare un errore con username o password mancanti', async () => {
            const loginDataMissingUsername: LoginRequestDTO = {
                username: '', // Mancante
                password: 'password123',
            };
            await expect(userController.loginUser(loginDataMissingUsername)).rejects.toThrow('MISSING_CREDENTIALS');

            const loginDataMissingPassword: LoginRequestDTO = {
                username: 'existinguser',
                password: '', // Mancante
            };
            await expect(userController.loginUser(loginDataMissingPassword)).rejects.toThrow('MISSING_CREDENTIALS');
        });

        it('dovrebbe lanciare un errore con credenziali non valide', async () => {
            const loginDataWrongPassword: LoginRequestDTO = {
                username: 'existinguser',
                password: 'wrongpassword', // Password errata
            };
            await expect(userController.loginUser(loginDataWrongPassword)).rejects.toThrow('INVALID_CREDENTIALS');

            const loginDataNonExistentUser: LoginRequestDTO = {
                username: 'nonexistent', // Utente inesistente
                password: 'password123',
            };
            await expect(userController.loginUser(loginDataNonExistentUser)).rejects.toThrow('INVALID_CREDENTIALS');
        });
    });


    // --- Test per getUserByUsername ---
    describe('getUserByUsername', () => {
        it('dovrebbe restituire un utente con successo', async () => {
            const userDTO = await userController.getUserByUsername('existinguser');
            expect(userDTO).toBeDefined();
            expect(userDTO.username).toBe('existinguser');
        });

        it('dovrebbe lanciare un errore se l\'utente non è stato trovato', async () => {
            await expect(userController.getUserByUsername('nonexistent')).rejects.toThrow('USER_NOT_FOUND');
        });
    });

    // --- Test per getUserIdByUsername ---
    describe('getUserIdByUsername', () => {
        it('dovrebbe restituire l\'ID dell\'utente con successo', async () => {
            const userId = await userController.getUserIdByUsername('existinguser');
            expect(userId).toBe(testUser.id);
        });

        it('dovrebbe lanciare un errore se l\'utente non è stato trovato', async () => {
            await expect(userController.getUserIdByUsername('nonexistent')).rejects.toThrow('USER_NOT_FOUND');
        });
    });

    // --- Test per getAllCategories ---
    describe('getAllCategories', () => {
        it('dovrebbe restituire tutte le categorie', async () => {
            // Aggiungiamo un'altra categoria per avere più di una
            const anotherCategory = new Category();
            anotherCategory.name = 'Altra Categoria';
            await categoryRepository.save(anotherCategory); // Usa .save() dal repository diretto

            const categoriesDTOs = await userController.getAllCategories();
            expect(categoriesDTOs).toBeDefined();
            expect(categoriesDTOs.length).toBe(2); // testCategory e anotherCategory
            expect(categoriesDTOs.some(c => c.name === 'Incidente')).toBe(true);
            expect(categoriesDTOs.some(c => c.name === 'Altra Categoria')).toBe(true);
        });

        it('dovrebbe restituire un array vuoto se non ci sono categorie', async () => {
            // Pulisci le categorie create nel beforeEach per questo test
            await categoryRepository.query(`DELETE FROM "category";`);
            const categoriesDTOs = await userController.getAllCategories();
            expect(categoriesDTOs).toBeDefined();
            expect(categoriesDTOs).toHaveLength(0);
        });
    });
});


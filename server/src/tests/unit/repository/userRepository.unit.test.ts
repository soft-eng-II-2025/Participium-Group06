// // src/tests/unit/UserRepository.unit.test.ts
// import { UserRepository } from "../../../repositories/UserRepository";
// import { User } from "../../../models/User";

// // Mock della repository di TypeORM
// const mockOrmRepository = {
//     find: jest.fn(),
//     findOneBy: jest.fn(),
//     // Implementazione del mock di save: restituisce l'oggetto che gli viene passato
//     save: jest.fn().mockImplementation(u => Promise.resolve(u)),
//     remove: jest.fn().mockResolvedValue(undefined),
// };

// describe("UserRepository - Unit Test (Mock ORM)", () => {
//     let userRepository: UserRepository;
//     // Definizione di un mock User (assicuriamoci che abbia tutti i campi necessari per TypeORM)
//     const mockUser = {
//         id: 1,
//         username: "testuser",
//         email: "test@test.com",
//         password: "p",
//         first_name: "Test",
//         last_name: "User",
//         photo: "old_photo.jpg",
//         telegram_id: "old_tg",
//         flag_email: false,
//     } as User;

//     beforeEach(() => {
//         // Simula il costruttore del DataSource e getRepository
//         const mockDataSource = {
//             getRepository: jest.fn(() => mockOrmRepository),
//         };
//         userRepository = new UserRepository(mockDataSource as any);
//         jest.clearAllMocks();

//         // Setup base per findOneBy: restituisce l'utente mock
//         mockOrmRepository.findOneBy.mockResolvedValue(mockUser);
//         // Resetta l'implementazione di save per ogni test, per tracciare le chiamate
//         mockOrmRepository.save.mockImplementation(u => Promise.resolve(u));
//     });

//     // ------------------------------------------------------------------
//     // Finders
//     // ------------------------------------------------------------------
//     it("dovrebbe chiamare find per findAll", async () => {
//         await userRepository.findAll();
//         expect(mockOrmRepository.find).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare findOneBy per findByUsername", async () => {
//         await userRepository.findByUsername("testuser");
//         expect(mockOrmRepository.findOneBy).toHaveBeenCalledWith({ username: "testuser" });
//     });

//     it("dovrebbe chiamare findOneBy per findByid", async () => {
//         await userRepository.findByid(1);
//         expect(mockOrmRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
//     });

//     it("dovrebbe chiamare findOneBy per findByEmail", async () => {
//         await userRepository.findByEmail("test@test.com");
//         expect(mockOrmRepository.findOneBy).toHaveBeenCalledWith({ email: "test@test.com" });
//     });

//     // ------------------------------------------------------------------
//     // CRUD e Update
//     // ------------------------------------------------------------------
//     it("dovrebbe chiamare save per add", async () => {
//         await userRepository.add(mockUser);
//         expect(mockOrmRepository.save).toHaveBeenCalledWith(mockUser);
//     });

//     it("dovrebbe chiamare remove per remove", async () => {
//         await userRepository.remove(mockUser);
//         expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockUser);
//     });

//     it("dovrebbe chiamare save per changePassword e aggiornare il campo", async () => {
//         const result = await userRepository.changePassword(mockUser, "new_p");
//         expect(result.password).toBe("new_p");
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare save per changePhoto e aggiornare il campo", async () => {
//         const result = await userRepository.changePhoto(mockUser, "url.jpg");
//         expect(result.photo).toBe("url.jpg");
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     // --- Metodi changeX aggiunti per copertura completa ---

//     it("dovrebbe chiamare save per changeEmail e aggiornare il campo", async () => {
//         const newEmail = "new@email.com";
//         const result = await userRepository.changeEmail(mockUser, newEmail);
//         expect(result.email).toBe(newEmail);
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare save per changeUsername e aggiornare il campo", async () => {
//         const newUsername = "new_username_1";
//         const result = await userRepository.changeUsername(mockUser, newUsername);
//         expect(result.username).toBe(newUsername);
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare save per changeLastName e aggiornare il campo", async () => {
//         const newLastName = "Smith";
//         const result = await userRepository.changeLastName(mockUser, newLastName);
//         expect(result.last_name).toBe(newLastName);
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare save per changeFirstName e aggiornare il campo", async () => {
//         const newFirstName = "John";
//         const result = await userRepository.changeFirstName(mockUser, newFirstName);
//         expect(result.first_name).toBe(newFirstName);
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare save per changeTelegramId e aggiornare il campo", async () => {
//         const newTelegramId = "@john_telegram";
//         const result = await userRepository.changeTelegramId(mockUser, newTelegramId);
//         expect(result.telegram_id).toBe(newTelegramId);
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });

//     it("dovrebbe chiamare save per changeFlagEmail e aggiornare il campo", async () => {
//         const newFlagEmail = true;
//         const result = await userRepository.changeFlagEmail(mockUser, newFlagEmail);
//         expect(result.flag_email).toBe(newFlagEmail);
//         expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
//     });
// });
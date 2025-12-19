// // ========================
// // 🔥 MOCK PRIMA DEGLI IMPORT
// // ========================

// // Mock crypto
// jest.mock("crypto", () => ({
//     randomInt: jest.fn(() => 123456),
// }));

// // Mock email sender
// const sendVerificationEmailMock = jest.fn();
// jest.mock("../../../services/emailService", () => ({
//     sendVerificationEmail: (...args: any[]) => sendVerificationEmailMock(...args),
// }));

// // Mock UserRepository
// const mockUserRepoInstance = {
//     findByUsername: jest.fn(),
//     changeVerified: jest.fn(),
// };
// const UserRepositoryMock = jest.fn(() => mockUserRepoInstance);

// jest.mock("../../../repositories/UserRepository", () => ({
//     UserRepository: UserRepositoryMock,
// }));

// // Mock VerificationCodeRepository
// const mockCodeRepoInstance = {
//     createForUser: jest.fn(),
//     deleteExpired: jest.fn(),
//     verifyAndConsume: jest.fn(),
//     deleteExpiredWithUsers: jest.fn(),
// };
// const VerificationCodeRepositoryMock = jest.fn(() => mockCodeRepoInstance);

// jest.mock("../../../repositories/VerificationCodeRepository", () => ({
//     VerificationCodeRepository: VerificationCodeRepositoryMock,
// }));

// // ========================
// // ⬇️ ORA GLI IMPORT REALI
// // ========================
// import { DataSource } from "typeorm";
// import { VerificationService } from "../../../services/verificationService";
// import crypto from "node:crypto";
// import { User } from "../../../models/User";
// import { UserResponseDTO } from "../../../models/DTOs/UserResponseDTO";


// // ========================
// // 🔧 TEST SETUP
// // ========================
// describe("VerificationService", () => {

//     let service: VerificationService;
//     let mockDataSource: DataSource;

//     const mockUserDAO = new User();
//     mockUserDAO.id = 1;
//     mockUserDAO.username = "testuser";
//     mockUserDAO.email = "test@example.com";
//     mockUserDAO.verified = false;

//     const mockUserDTO: UserResponseDTO = {
//         userId: 1,
//         username: "testuser",
//         email: "test@example.com",
//         first_name: "Test",
//         last_name: "User",
//         photo: null,
//         telegram_id: null,
//         flag_email: true,
//         reports: [],
//         verified: false,
//     };

//     beforeEach(() => {
//         jest.clearAllMocks();

//         mockDataSource = {} as DataSource;
//         service = new VerificationService(mockDataSource);

//         // default
//         mockUserRepoInstance.findByUsername.mockResolvedValue(mockUserDAO);
//         mockCodeRepoInstance.verifyAndConsume.mockResolvedValue(true);
//     });


//     // ========================
//     // TEST: generateAndSend()
//     // ========================
//     describe("generateAndSend", () => {
//         it("should generate code, save it, and send email", async () => {

//             await service.generateAndSend(mockUserDTO);

//             expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
//             expect(mockCodeRepoInstance.createForUser).toHaveBeenCalledWith(
//                 mockUserDAO,
//                 "123456"
//             );

//             expect(sendVerificationEmailMock).toHaveBeenCalledWith(
//                 mockUserDAO.email,
//                 "123456"
//             );
//         });

//         it("should throw USER_NOT_FOUND if user does not exist", async () => {
//             mockUserRepoInstance.findByUsername.mockResolvedValue(null);

//             await expect(service.generateAndSend(mockUserDTO))
//                 .rejects.toThrow("USER_NOT_FOUND");

//             expect(mockCodeRepoInstance.createForUser).not.toHaveBeenCalled();
//             expect(sendVerificationEmailMock).not.toHaveBeenCalled();
//         });
//     });


//     // ========================
//     // TEST: verifyCode()
//     // ========================
//     describe("verifyCode", () => {
//         const RAW_CODE = "123456";

//         it("should verify, update user, return true", async () => {

//             const result = await service.verifyCode(mockUserDTO.username, RAW_CODE);

//             expect(mockCodeRepoInstance.deleteExpired).toHaveBeenCalled();
//             expect(mockCodeRepoInstance.verifyAndConsume)
//                 .toHaveBeenCalledWith(mockUserDAO.id, RAW_CODE);

//             expect(mockUserRepoInstance.changeVerified)
//                 .toHaveBeenCalledWith(expect.objectContaining({ verified: true }), true);

//             expect(result).toBe(true);
//         });

//         it("should throw USER_NOT_FOUND if user does not exist", async () => {
//             mockUserRepoInstance.findByUsername.mockResolvedValue(null);

//             await expect(
//                 service.verifyCode(mockUserDTO.username, RAW_CODE)
//             ).rejects.toThrow("USER_NOT_FOUND");

//             expect(mockCodeRepoInstance.verifyAndConsume).not.toHaveBeenCalled();
//             expect(mockUserRepoInstance.changeVerified).not.toHaveBeenCalled();
//         });

//         it("should throw INVALID_CODE if code verification fails", async () => {
//             mockCodeRepoInstance.verifyAndConsume.mockResolvedValue(false);

//             await expect(
//                 service.verifyCode(mockUserDTO.username, RAW_CODE)
//             ).rejects.toThrow("INVALID_CODE");

//             expect(mockUserRepoInstance.changeVerified).not.toHaveBeenCalled();
//         });
//     });


//     // ========================
//     // TEST: cleanupExpired()
//     // ========================
//     describe("cleanupExpired", () => {
//         it("should call deleteExpiredWithUsers", async () => {

//             await service.cleanupExpired();

//             expect(mockCodeRepoInstance.deleteExpiredWithUsers).toHaveBeenCalled();
//         });
//     });
// });

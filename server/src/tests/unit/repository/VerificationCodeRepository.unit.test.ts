// // src/tests/unit/repository/VerificationCodeRepository.unit.test.ts
// import { VerificationCodeRepository } from "../../../repositories/VerificationCodeRepository";
// import { VerificationCode } from "../../../models/VerificationCode";
// import { User } from "../../../models/User";
// import * as argon2 from "argon2";

// // Mock argon2
// jest.mock("argon2");

// // Mock of TypeORM repository
// const mockOrmRepository = {
//   create: jest.fn(),
//   findOne: jest.fn(),
//   save: jest.fn().mockImplementation(v => Promise.resolve(v)),
//   remove: jest.fn().mockResolvedValue(undefined),
//   createQueryBuilder: jest.fn(),
// };

// const mockUserRepository = {
//   createQueryBuilder: jest.fn(),
// };

// describe("VerificationCodeRepository - Unit Test (Mock ORM)", () => {
//   let verificationCodeRepository: VerificationCodeRepository;

//   // Mock data
//   const mockUser: User = {
//     id: 1,
//     username: "testuser",
//     email: "test@example.com",
//     password: "hashed_password",
//     first_name: "Test",
//     last_name: "User",
//     photo: null,
//     telegram_id: null,
//     flag_email: true,
//     verified: false,
//     reports: [],
//     notifications: [],
//   } as User;

//   const mockVerifiedUser: User = {
//     ...mockUser,
//     id: 2,
//     verified: true,
//   };

//   const mockVerificationCode: VerificationCode = {
//     id: 10,
//     user: mockUser,
//     code_hash: "hashed_code_123",
//     expires_at: new Date(Date.now() + 15 * 60_000), // 15 minutes from now
//   } as VerificationCode;

//   const mockExpiredCode: VerificationCode = {
//     id: 11,
//     user: mockUser,
//     code_hash: "hashed_code_expired",
//     expires_at: new Date(Date.now() - 10 * 60_000), // 10 minutes ago
//   } as VerificationCode;

//   beforeEach(() => {
//     // Mock DataSource and getRepository
//     const mockDataSource = {
//       getRepository: jest.fn((entity) => {
//         if (entity === VerificationCode) return mockOrmRepository;
//         if (entity === User) return mockUserRepository;
//       }),
//     };

//     verificationCodeRepository = new VerificationCodeRepository(mockDataSource as any);
//     jest.clearAllMocks();

//     // Default setup
//     mockOrmRepository.create.mockReturnValue(mockVerificationCode);
//     mockOrmRepository.findOne.mockResolvedValue(mockVerificationCode);
//     mockOrmRepository.save.mockImplementation(v => Promise.resolve(v));
//     (argon2.hash as jest.Mock).mockResolvedValue("hashed_code_123");
//     (argon2.verify as jest.Mock).mockResolvedValue(true);
//   });

//   // ------------------------------------------------------------------
//   // createForUser
//   // ------------------------------------------------------------------
//   it("should hash the raw code and create verification code with 30 minute expiration", async () => {
//     const rawCode = "123456";
//     const now = Date.now();

//     const result = await verificationCodeRepository.createForUser(mockUser, rawCode);

//     expect(argon2.hash).toHaveBeenCalledWith(rawCode);
//     expect(mockOrmRepository.create).toHaveBeenCalled();
//     expect(mockOrmRepository.save).toHaveBeenCalled();
//     expect(result).toEqual(mockVerificationCode);

//     // Verify expiration is approximately 30 minutes from now
//     const createdEntry = (mockOrmRepository.create as jest.Mock).mock.calls[0][0];
//     const expirationDiff = createdEntry.expires_at.getTime() - now;
//     expect(expirationDiff).toBeGreaterThan(29 * 60_000);
//     expect(expirationDiff).toBeLessThan(31 * 60_000);
//   });

//   it("should set user on the verification code entry", async () => {
//     const rawCode = "123456";

//     await verificationCodeRepository.createForUser(mockUser, rawCode);

//     const createdEntry = (mockOrmRepository.create as jest.Mock).mock.calls[0][0];
//     expect(createdEntry.user).toEqual(mockUser);
//   });

//   // ------------------------------------------------------------------
//   // findByUserId
//   // ------------------------------------------------------------------
//   it("should call findOne with user id filter and user relations for findByUserId", async () => {
//     await verificationCodeRepository.findByUserId(1);

//     expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
//       where: { user: { id: 1 } },
//       relations: ["user"],
//     });
//   });

//   it("should return verification code by user id", async () => {
//     const result = await verificationCodeRepository.findByUserId(1);

//     expect(result).toEqual(mockVerificationCode);
//   });

//   it("should return null when no verification code found for user", async () => {
//     mockOrmRepository.findOne.mockResolvedValueOnce(null);

//     const result = await verificationCodeRepository.findByUserId(999);

//     expect(result).toBeNull();
//   });

//   // ------------------------------------------------------------------
//   // delete
//   // ------------------------------------------------------------------
//   it("should call remove for delete", async () => {
//     await verificationCodeRepository.delete(mockVerificationCode);

//     expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockVerificationCode);
//   });

//   it("should handle removing multiple codes in sequence", async () => {
//     await verificationCodeRepository.delete(mockVerificationCode);
//     await verificationCodeRepository.delete(mockExpiredCode);

//     expect(mockOrmRepository.remove).toHaveBeenCalledTimes(2);
//   });

//   // ------------------------------------------------------------------
//   // deleteExpired
//   // ------------------------------------------------------------------
//   it("should use queryBuilder to delete expired codes", async () => {
//     const mockQueryBuilder = {
//       delete: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue({ affected: 1 }),
//     };

//     mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

//     await verificationCodeRepository.deleteExpired();

//     expect(mockOrmRepository.createQueryBuilder).toHaveBeenCalled();
//     expect(mockQueryBuilder.delete).toHaveBeenCalled();
//     expect(mockQueryBuilder.from).toHaveBeenCalledWith(VerificationCode);
//     expect(mockQueryBuilder.where).toHaveBeenCalled();
//     expect(mockQueryBuilder.execute).toHaveBeenCalled();
//   });

//   it("should use correct ISO string format for expires_at comparison", async () => {
//     const mockQueryBuilder = {
//       delete: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue({ affected: 1 }),
//     };

//     mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

//     await verificationCodeRepository.deleteExpired();

//     const whereCall = (mockQueryBuilder.where as jest.Mock).mock.calls[0];
//     expect(whereCall[0]).toContain("expires_at < :now");
//     expect(whereCall[1].now).toMatch(/\d{4}-\d{2}-\d{2}/); // ISO date format
//   });

//   // ------------------------------------------------------------------
//   // verifyAndConsume
//   // ------------------------------------------------------------------
//   it("should return false when verification code not found", async () => {
//     mockOrmRepository.findOne.mockResolvedValueOnce(null);

//     const result = await verificationCodeRepository.verifyAndConsume(999, "123456");

//     expect(result).toBe(false);
//     expect(mockOrmRepository.remove).not.toHaveBeenCalled();
//   });

//   it("should return false and delete expired code when code is expired", async () => {
//     mockOrmRepository.findOne.mockResolvedValueOnce(mockExpiredCode);

//     const result = await verificationCodeRepository.verifyAndConsume(1, "123456");

//     expect(result).toBe(false);
//     expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockExpiredCode);
//   });

//   it("should return false when code hash verification fails", async () => {
//     mockOrmRepository.findOne.mockResolvedValueOnce(mockVerificationCode);
//     (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

//     const result = await verificationCodeRepository.verifyAndConsume(1, "wrong_code");

//     expect(argon2.verify).toHaveBeenCalledWith(mockVerificationCode.code_hash, "wrong_code");
//     expect(result).toBe(false);
//     expect(mockOrmRepository.remove).not.toHaveBeenCalled();
//   });

//   it("should return true, delete code and call verify when all conditions pass", async () => {
//     mockOrmRepository.findOne.mockResolvedValueOnce(mockVerificationCode);
//     (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

//     const result = await verificationCodeRepository.verifyAndConsume(1, "123456");

//     expect(argon2.verify).toHaveBeenCalledWith(mockVerificationCode.code_hash, "123456");
//     expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockVerificationCode);
//     expect(result).toBe(true);
//   });

//   // ------------------------------------------------------------------
//   // deleteExpiredWithUsers
//   // ------------------------------------------------------------------
//   it("should delete expired codes and unverified users with deleteExpiredWithUsers", async () => {
//     const mockCodeQueryBuilder = {
//       leftJoinAndSelect: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       getMany: jest.fn().mockResolvedValue([mockExpiredCode]),
//     };

//     const mockDeleteCodeQueryBuilder = {
//       delete: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue({ affected: 1 }),
//     };

//     const mockDeleteUserQueryBuilder = {
//       delete: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       andWhere: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue({ affected: 1 }),
//     };

//     let callCount = 0;
//     mockOrmRepository.createQueryBuilder.mockImplementation(() => {
//       callCount++;
//       if (callCount === 1) return mockCodeQueryBuilder;
//       if (callCount === 2) return mockDeleteCodeQueryBuilder;
//       return mockDeleteUserQueryBuilder;
//     });

//     mockUserRepository.createQueryBuilder.mockReturnValue(mockDeleteUserQueryBuilder);

//     await verificationCodeRepository.deleteExpiredWithUsers();

//     expect(mockCodeQueryBuilder.getMany).toHaveBeenCalled();
//     expect(mockDeleteCodeQueryBuilder.execute).toHaveBeenCalled();
//     expect(mockDeleteUserQueryBuilder.andWhere).toHaveBeenCalledWith("verified = false");
//   });

//   it("should extract user ids from expired codes", async () => {
//     const code1 = { ...mockExpiredCode, user: { ...mockUser, id: 1 } };
//     const code2 = { ...mockExpiredCode, user: { ...mockUser, id: 2 }, id: 12 };

//     const mockCodeQueryBuilder = {
//       leftJoinAndSelect: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       getMany: jest.fn().mockResolvedValue([code1, code2]),
//     };

//     const mockDeleteCodeQueryBuilder = {
//       delete: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue({ affected: 2 }),
//     };

//     const mockDeleteUserQueryBuilder = {
//       delete: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       andWhere: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue({ affected: 2 }),
//     };

//     let callCount = 0;
//     mockOrmRepository.createQueryBuilder.mockImplementation(() => {
//       callCount++;
//       if (callCount === 1) return mockCodeQueryBuilder;
//       if (callCount === 2) return mockDeleteCodeQueryBuilder;
//       return mockDeleteUserQueryBuilder;
//     });

//     mockUserRepository.createQueryBuilder.mockReturnValue(mockDeleteUserQueryBuilder);

//     await verificationCodeRepository.deleteExpiredWithUsers();

//     const whereCall = (mockDeleteUserQueryBuilder.where as jest.Mock).mock.calls[0];
//     expect(whereCall[1].ids).toContain(1);
//     expect(whereCall[1].ids).toContain(2);
//   });

//   it("should return early if no expired codes found", async () => {
//     const mockCodeQueryBuilder = {
//       leftJoinAndSelect: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       getMany: jest.fn().mockResolvedValue([]),
//     };

//     mockOrmRepository.createQueryBuilder.mockReturnValue(mockCodeQueryBuilder);

//     await verificationCodeRepository.deleteExpiredWithUsers();

//     expect(mockCodeQueryBuilder.getMany).toHaveBeenCalled();
//     // Verify no further operations are called
//     expect(mockUserRepository.createQueryBuilder).not.toHaveBeenCalled();
//   });

//   // ------------------------------------------------------------------
//   // Edge Cases
//   // ------------------------------------------------------------------
//   it("should handle verification code expiring just before current time", async () => {
//     const now = new Date();
//     const codeExpiredJustBefore: VerificationCode = {
//       ...mockVerificationCode,
//       expires_at: new Date(now.getTime() - 1), // 1ms before now
//     };

//     mockOrmRepository.findOne.mockResolvedValueOnce(codeExpiredJustBefore);

//     const result = await verificationCodeRepository.verifyAndConsume(1, "123456");

//     expect(result).toBe(false);
//     expect(mockOrmRepository.remove).toHaveBeenCalled();
//   });

//   it("should properly hash codes with special characters", async () => {
//     const specialCode = "!@#$%^&*()_+-=[]{}|;:,.<>?";

//     await verificationCodeRepository.createForUser(mockUser, specialCode);

//     expect(argon2.hash).toHaveBeenCalledWith(specialCode);
//   });

//   it("should handle multiple verification attempts in sequence", async () => {
//     mockOrmRepository.findOne.mockResolvedValue(mockVerificationCode);
//     (argon2.verify as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

//     const result1 = await verificationCodeRepository.verifyAndConsume(1, "wrong");
//     const result2 = await verificationCodeRepository.verifyAndConsume(1, "correct");

//     expect(result1).toBe(false);
//     expect(result2).toBe(true);
//   });
// });
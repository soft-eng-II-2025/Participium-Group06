// src/tests/integration/repositories/VerificationCodeRepository.test.ts
import { TestDataSource } from '../../test-data-source';
import { VerificationCodeRepository } from '../../../repositories/VerificationCodeRepository';
import { VerificationCode } from '../../../models/VerificationCode';
import { User } from '../../../models/User';
import { Repository } from 'typeorm';
import * as argon2 from "argon2";

describe('VerificationCodeRepository (integration)', () => {
    let verificationCodeRepository: VerificationCodeRepository;
    let userRepository: Repository<User>;
    let verificationCodeOrmRepository: Repository<VerificationCode>;

    let testUser: User;

    beforeAll(async () => {
        if (!TestDataSource.isInitialized) {
            await TestDataSource.initialize();
        }
    });

    afterAll(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
    });

    beforeEach(async () => {
        // Drop specifically our tables to avoid pg_type conflicts
        await TestDataSource.query(`DROP TABLE IF EXISTS "verification_code" CASCADE`);
        await TestDataSource.query(`DROP TABLE IF EXISTS "app_user" CASCADE`);
        await TestDataSource.synchronize(false);
        
        verificationCodeRepository = new VerificationCodeRepository(TestDataSource);
        userRepository = TestDataSource.getRepository(User);
        verificationCodeOrmRepository = TestDataSource.getRepository(VerificationCode);

        // Create a test user
        testUser = new User();
        testUser.username = 'testuser';
        testUser.email = 'test@example.com';
        testUser.password = 'password123';
        testUser.first_name = 'Test';
        testUser.last_name = 'User';
        testUser.verified = false;
        await userRepository.save(testUser);
    });

    it('should create a verification code for a user', async () => {
        const rawCode = '123456';
        const saved = await verificationCodeRepository.createForUser(testUser, rawCode);

        expect(saved).toBeDefined();
        expect(saved.id).toBeDefined();
        expect(saved.user.id).toBe(testUser.id);
        
        // Verify hash
        const isMatch = await argon2.verify(saved.code_hash, rawCode);
        expect(isMatch).toBe(true);
        
        // Verify expiry (should be around 30 minutes)
        const now = new Date();
        const diff = saved.expires_at.getTime() - now.getTime();
        expect(diff).toBeGreaterThan(29 * 60 * 1000);
        expect(diff).toBeLessThan(31 * 60 * 1000);
    });

    it('should find a verification code by user ID', async () => {
        const rawCode = '654321';
        await verificationCodeRepository.createForUser(testUser, rawCode);

        const found = await verificationCodeRepository.findByUserId(testUser.id);
        expect(found).not.toBeNull();
        expect(found?.user.id).toBe(testUser.id);
    });

    it('should return null when finding by non-existent user ID', async () => {
        const found = await verificationCodeRepository.findByUserId(999);
        expect(found).toBeNull();
    });

    it('should verify and consume a valid code', async () => {
        const rawCode = '111222';
        await verificationCodeRepository.createForUser(testUser, rawCode);

        const result = await verificationCodeRepository.verifyAndConsume(testUser.id, rawCode);
        expect(result).toBe(true);

        // Verify it was consumed (deleted)
        const found = await verificationCodeRepository.findByUserId(testUser.id);
        expect(found).toBeNull();
    });

    it('should not verify an incorrect code', async () => {
        const rawCode = '111222';
        await verificationCodeRepository.createForUser(testUser, rawCode);

        const result = await verificationCodeRepository.verifyAndConsume(testUser.id, 'wrongcode');
        expect(result).toBe(false);

        // Code should still exist if not verified (actually implementation returns false and keeps it? Let's check)
        // Implementation check: if (!ok) return false; -> does NOT delete
        const found = await verificationCodeRepository.findByUserId(testUser.id);
        expect(found).not.toBeNull();
    });

    it('should not verify an expired code and delete it', async () => {
        const rawCode = '111222';
        // Manually create an expired code
        const hash = await argon2.hash(rawCode);
        const expiredCode = verificationCodeOrmRepository.create({
            user: testUser,
            code_hash: hash,
            expires_at: new Date(Date.now() - 1000) // 1 second ago
        });
        await verificationCodeOrmRepository.save(expiredCode);

        const result = await verificationCodeRepository.verifyAndConsume(testUser.id, rawCode);
        expect(result).toBe(false);

        // Should be deleted
        const found = await verificationCodeRepository.findByUserId(testUser.id);
        expect(found).toBeNull();
    });

    it('should delete a specific code', async () => {
        const code = await verificationCodeRepository.createForUser(testUser, '123456');
        await verificationCodeRepository.delete(code);

        const found = await verificationCodeRepository.findByUserId(testUser.id);
        expect(found).toBeNull();
    });

    it('should delete expired codes only', async () => {
        // One fresh
        await verificationCodeRepository.createForUser(testUser, '111111');
        
        // One expired
        const user2 = new User();
        user2.username = 'user2';
        user2.email = 'user2@example.com';
        user2.password = 'pass';
        user2.first_name = 'U2';
        user2.last_name = 'U2';
        await userRepository.save(user2);

        const hash = await argon2.hash('222222');
        const expiredCode = verificationCodeOrmRepository.create({
            user: user2,
            code_hash: hash,
            expires_at: new Date(Date.now() - 60000)
        });
        await verificationCodeOrmRepository.save(expiredCode);

        await verificationCodeRepository.deleteExpired();

        const remainingCodes = await verificationCodeOrmRepository.find({ relations: ["user"] });
        expect(remainingCodes.length).toBe(1);
        expect(remainingCodes[0].user).toBeDefined();
        expect(remainingCodes[0].user.id).toBe(testUser.id);
        
        const foundFresh = await verificationCodeRepository.findByUserId(testUser.id);
        expect(foundFresh).not.toBeNull();

        const foundExpired = await verificationCodeRepository.findByUserId(user2.id);
        expect(foundExpired).toBeNull();
    });

    it('should delete expired codes and their unverified users', async () => {
        // User 2: Expired code + verified = false -> should be deleted
        const user2 = new User();
        user2.username = 'user2';
        user2.email = 'user2@example.com';
        user2.password = 'pass';
        user2.first_name = 'U2';
        user2.last_name = 'U2';
        user2.verified = false;
        await userRepository.save(user2);

        const hash2 = await argon2.hash('222222');
        const expiredCode2 = verificationCodeOrmRepository.create({
            user: user2,
            code_hash: hash2,
            expires_at: new Date(Date.now() - 60000)
        });
        await verificationCodeOrmRepository.save(expiredCode2);

        // User 3: Expired code + verified = true -> code deleted, user kept
        const user3 = new User();
        user3.username = 'user3';
        user3.email = 'user3@example.com';
        user3.password = 'pass';
        user3.first_name = 'U3';
        user3.last_name = 'U3';
        user3.verified = true;
        await userRepository.save(user3);

        const hash3 = await argon2.hash('333333');
        const expiredCode3 = verificationCodeOrmRepository.create({
            user: user3,
            code_hash: hash3,
            expires_at: new Date(Date.now() - 60000)
        });
        await verificationCodeOrmRepository.save(expiredCode3);

        await verificationCodeRepository.deleteExpiredWithUsers();

        // Check codes
        const codes = await verificationCodeOrmRepository.find();
        expect(codes.length).toBe(0);

        // Check users
        const u2 = await userRepository.findOneBy({ id: user2.id });
        expect(u2).toBeNull();

        const u3 = await userRepository.findOneBy({ id: user3.id });
        expect(u3).not.toBeNull();
    });
});

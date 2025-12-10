// src/utils/passwordService.test.ts
import { hashPassword, verifyPassword } from '../../../services/passwordService';

// Mock di argon2 per isolare il test
import argon2 from 'argon2';
jest.mock('argon2', () => ({
    hash: jest.fn((plain, options) => Promise.resolve(`hashed_${plain}_${options.memoryCost}`)),
    verify: jest.fn((hash, plain) => Promise.resolve(hash === `hashed_${plain}_65536`)),
    argon2id: Symbol('argon2id'),
}));


describe('Password Service (Argon2)', () => {
    const PLAIN_PASSWORD = 'secure_password';
    const MOCK_HASH = 'hashed_secure_password_65536';

    describe('hashPassword', () => {
        it('should call argon2.hash with correct parameters', async () => {
            await hashPassword(PLAIN_PASSWORD);

            expect(argon2.hash).toHaveBeenCalledWith(PLAIN_PASSWORD, {
                type: (argon2 as any).argon2id,
                memoryCost: 65536, // 2 ** 16
                timeCost: 3,
                parallelism: 1,
            });
        });

        it('should return the mocked hashed password', async () => {
            const result = await hashPassword(PLAIN_PASSWORD);
            expect(result).toBe(MOCK_HASH);
        });
    });

    describe('verifyPassword', () => {
        // Test di successo (mockato per restituire true se i parametri corrispondono)
        it('should return true for a correct password/hash combination', async () => {
            const result = await verifyPassword(MOCK_HASH, PLAIN_PASSWORD);
            expect(argon2.verify).toHaveBeenCalledWith(MOCK_HASH, PLAIN_PASSWORD);
            expect(result).toBe(true);
        });

        // Test di fallimento (mockato per restituire false se i parametri non corrispondono)
        it('should return false for an incorrect password', async () => {
            const INCORRECT_PASSWORD = 'wrong_password';
            const result = await verifyPassword(MOCK_HASH, INCORRECT_PASSWORD);
            expect(argon2.verify).toHaveBeenCalledWith(MOCK_HASH, INCORRECT_PASSWORD);
            expect(result).toBe(false);
        });

        // Test per gestione errori (p. es. hash malformato)
        it('should return false if argon2.verify throws an error', async () => {
            // Configura il mock per lanciare un errore
            (argon2.verify as jest.Mock).mockRejectedValueOnce(new Error('Invalid hash format'));

            const result = await verifyPassword('bad_hash', PLAIN_PASSWORD);
            expect(result).toBe(false);
        });
    });
});
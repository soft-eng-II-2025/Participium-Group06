import argon2 from "argon2";

/**
 * Hash a plain password using Argon2id.
 * Adjust memoryCost/timeCost/parallelism to your security/perf needs.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify a plain password against a stored hash.
 * Returns true if match, false otherwise.
 */
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}
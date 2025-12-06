import { DataSource } from "typeorm";
import { VerificationCodeRepository } from "../repositories/VerificationCodeRepository";
import { UserRepository } from "../repositories/UserRepository";
import { sendVerificationEmail } from "./emailService"; // Make sure this exists
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import crypto from "crypto";

export class VerificationService {
  private codeRepo: VerificationCodeRepository;
  private userRepo: UserRepository;

  constructor(dataSource: DataSource) {
    this.codeRepo = new VerificationCodeRepository(dataSource);
    this.userRepo = new UserRepository(dataSource);
  }

  async generateAndSend(userdto: UserResponseDTO) {
    const user = await this.userRepo.findByUsername(userdto.username);
    if (!user) throw new Error("USER_NOT_FOUND");

    //const raw = String(Math.floor(100000 + Math.random() * 900000));
    // Codice OTP sicuro a 6 cifre
    const raw = crypto.randomInt(100000, 1000000).toString();

    await this.codeRepo.createForUser(user, raw);

    await sendVerificationEmail(user.email, raw);
  }

  async verifyCode(username: string, rawCode: string): Promise<boolean> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new Error("USER_NOT_FOUND");

    await this.codeRepo.deleteExpired();

    const ok = await this.codeRepo.verifyAndConsume(user.id, rawCode);
    if (!ok) throw new Error("INVALID_CODE");

    user.verified = true;
    await this.userRepo.changeVerified(user, true);

    return true;
  }

  async cleanupExpired() {
    await this.codeRepo.deleteExpiredWithUsers();
  }
}

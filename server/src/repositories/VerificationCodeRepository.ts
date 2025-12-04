import { Repository, DataSource } from "typeorm";
import { VerificationCode } from "../models/VerificationCode";
import { User } from "../models/User";
import * as argon2 from "argon2";

export class VerificationCodeRepository {
  private ormRepository: Repository<VerificationCode>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(VerificationCode);
  }

  async createForUser(user: User, rawCode: string): Promise<VerificationCode> {
    const hash = await argon2.hash(rawCode);

    const expires_at = new Date(Date.now() + 30 * 60_000); // 30 minutes

    const entry = this.ormRepository.create({
      user,
      code_hash: hash,
      expires_at,
    });

    return this.ormRepository.save(entry);
  }

  async findByUserId(userId: number): Promise<VerificationCode | null> {
    return this.ormRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"],
    });
  }

  async delete(entry: VerificationCode): Promise<void> {
    await this.ormRepository.remove(entry);
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();

    await this.ormRepository
      .createQueryBuilder()
      .delete()
      .from(VerificationCode)
      .where("expires_at < :now", { now: now.toISOString() })
      .execute();
  }

  async verifyAndConsume(userId: number, rawCode: string): Promise<boolean> {
    const entry = await this.findByUserId(userId);
    if (!entry) return false;

    const now = new Date();
    if (entry.expires_at < now) {
      await this.delete(entry);
      return false;
    }

    const ok = await argon2.verify(entry.code_hash, rawCode);
    if (!ok) return false;

    await this.delete(entry);
    return true;
  }
}

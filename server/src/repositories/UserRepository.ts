import { User } from "../models/User";
import {Repository, DataSource} from "typeorm";

export class UserRepository {
    protected ormRepository: Repository<User>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(User);
    }
    async findAll(): Promise<User[]> {
        return this.ormRepository.find();
    }
    async findByUsername(username: string): Promise<User | null> {
        return this.ormRepository.findOneBy({ username });
    }
    async findByTelegramUsername(telegram_username: string): Promise<User | null> {
        return this.ormRepository.findOneBy( {telegram_id: telegram_username })
    }
    async findByid(id: number): Promise<User | null> {
        return this.ormRepository.findOneBy({ id });
    }
    async findByEmail(email: string): Promise<User | null> {
        return this.ormRepository.findOneBy({ email });
    }
    async add(user: User): Promise<User> {
        return this.ormRepository.save(user);
    }
    async remove(user: User): Promise<void> {
        await this.ormRepository.remove(user);
    }
    async changePassword(user: User, newPassword: string): Promise<User> {
        user.password = newPassword;
        return this.ormRepository.save(user);
    }
    async changeEmail(user: User, newEmail: string): Promise<User> {
        user.email = newEmail;
        return this.ormRepository.save(user);
    }
    async changeUsername(user: User, newUsername: string): Promise<User> {
        user.username = newUsername;
        return this.ormRepository.save(user);
    }
    async changeLastName(user: User, newLastName: string): Promise<User> {
        user.last_name = newLastName;
        return this.ormRepository.save(user);
    }
    async changeFirstName(user: User, newFirstName: string): Promise<User> {
        user.first_name = newFirstName;
        return this.ormRepository.save(user);
    }
    async changePhoto(user: User, newPhoto: string): Promise<User> {
        user.photo = newPhoto;
        return this.ormRepository.save(user);
    }
    async changeTelegramId(user: User, newTelegramId: string): Promise<User> {
        user.telegram_id = newTelegramId;
        return this.ormRepository.save(user);
    }
    async changeFlagEmail(user: User, newFlagEmail: boolean): Promise<User> {
        user.flag_email = newFlagEmail;
        return this.ormRepository.save(user);
    }
    async changeVerified(user: User, newVerified: boolean): Promise<User> {
        user.verified = newVerified;
        return this.ormRepository.save(user);
    }
}
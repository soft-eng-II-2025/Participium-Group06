import { User } from "../models/User";
import {Repository} from "typeorm";
import { AppDataSource } from "../data-source";

export class UserRepository {
    protected ormRepository: Repository<User>;

    constructor() {
        this.ormRepository = AppDataSource.getRepository(User);
    }
    async findAll(): Promise<User[]> {
        return this.ormRepository.find();
    }
    async findByUsername(username: string): Promise<User | null> {
        return this.ormRepository.findOneBy({ username });
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
}
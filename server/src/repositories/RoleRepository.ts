import { Role } from "../models/Role";
import {Repository} from "typeorm";
import { AppDataSource } from "../data-source";
export class RoleRepository {
    protected ormRepository: Repository<Role>;
    constructor() {
        this.ormRepository = AppDataSource.getRepository(Role);
    }
    findAll(): Promise<Role[]> {
        return this.ormRepository.find();
    }
    findByTitle(title: string): Promise<Role | null> {
        return this.ormRepository.findOneBy({ title });
    }
    async add(role: Role): Promise<Role> {
        return this.ormRepository.save(role);
    }
    async remove(role: Role): Promise<void> {
        await this.ormRepository.remove(role);
    }
}
import { Role } from "../models/Role";
import {DataSource, Repository} from "typeorm";
import { AppDataSource } from "../data-source";
export class RoleRepository {
    private ormRepository: Repository<Role>;
    constructor(dataSource: DataSource = AppDataSource) {
        this.ormRepository = dataSource.getRepository(Role);
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
import { Role } from "../models/Role";
import {Repository, DataSource} from "typeorm";
//import { AppDataSource } from "../data-source";
export class RoleRepository {
    protected ormRepository: Repository<Role>;
    constructor(dataSource: DataSource) {
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
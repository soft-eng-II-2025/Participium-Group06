// src/repositories/RoleRepository.ts
import { Role } from "../models/Role";
import {DataSource, Repository} from "typeorm";
import {AppDataSource} from "../data-source";

export class RoleRepository {
    private ormRepository: Repository<Role>;
    constructor(dataSource: DataSource = AppDataSource) {
        this.ormRepository = dataSource.getRepository(Role);
    }

    findAll(): Promise<Role[]> {
        return this.ormRepository.find();
    }

    // elenco ruoli assegnabili: esclude admin/super admin
    findAssignable(): Promise<Role[]> {
        return this.ormRepository
            .createQueryBuilder("r")
            .where("LOWER(r.title) NOT IN (:...bad)", { bad: ["admin", "super admin"] })
            .getMany();
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

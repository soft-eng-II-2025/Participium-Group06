// src/repositories/RoleRepository.ts
import { Role } from "../models/Role";
import { Repository } from "typeorm";
import AppDataSource from "../data-source";

export class RoleRepository {
    protected ormRepository: Repository<Role>;

    constructor() {
        this.ormRepository = AppDataSource.getRepository(Role);
    }

    // elenco completo (se serve altrove)
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

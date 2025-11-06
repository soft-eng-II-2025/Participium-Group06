import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Repository} from "typeorm";
import { AppDataSource } from "../data-source";

export class MunicipalityOfficerRepository {
    protected ormRepository: Repository<MunicipalityOfficer>;
    constructor() {
        this.ormRepository = AppDataSource.getRepository(MunicipalityOfficer);
    }
    async findAll(): Promise<MunicipalityOfficer[]> {
        return this.ormRepository.find();
    }
    async findByusername(username: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOneBy({ username });
    }
    async findByEmail(email: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOneBy({ email });
    }
    async add(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }
    async update(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }
}
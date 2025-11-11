import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { DataSource, Repository} from "typeorm";
import { AppDataSource } from "../data-source";

export class MunicipalityOfficerRepository {
    protected ormRepository: Repository<MunicipalityOfficer>;
    constructor(dataSource: DataSource = AppDataSource) {
            this.ormRepository = dataSource.getRepository(MunicipalityOfficer);
        }
    async findAll(): Promise<MunicipalityOfficer[]> {
        return this.ormRepository.find();
    }
    async findByusername(user: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne(
            { where: { username: user },
            relations: ['role'], }
        );
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
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Repository} from "typeorm";
import { AppDataSource } from "../data-source";
import {mapMunicipalityOfficerDAOToDTO} from "../services/mapperService";

export class MunicipalityOfficerRepository {
    protected ormRepository: Repository<MunicipalityOfficer>;
    constructor() {
        this.ormRepository = AppDataSource.getRepository(MunicipalityOfficer);
    }
    async findAll(): Promise<MunicipalityOfficer[]> {
        return this.ormRepository.find();
    }
    /*async findByusername(username: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOneBy({ username });
    }

     */
    /**
     * NOTA: findOneBy non fa il join con le relazioni !!
     * segui l'esempio sotto con "relations" per specificare i join
     */
    async findByusername(username: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne({
            where: { username },
            relations: ['role'],
        });
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
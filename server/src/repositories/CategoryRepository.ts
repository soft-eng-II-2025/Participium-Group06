import { Category } from "../models/Category";
import {Repository, DataSource} from "typeorm";
//import { AppDataSource } from "../data-source";
import e from "express";

export class CategoryRepository {
    protected ormRepository: Repository<Category>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(Category);
    }

    async findAll(): Promise<Category[]> {
        return this.ormRepository.find();
    }

    async findByName(name: string): Promise<Category | null> {
        return this.ormRepository.findOneBy({ name });
    }

    async findById(id: number): Promise<Category | null> {
        return this.ormRepository.findOneBy({ id });
    }

    async add(category: Category): Promise<Category> {
        return this.ormRepository.save(category);
    }

    async remove(category: Category): Promise<void> {
        await this.ormRepository.remove(category);
    }
    async changeName(category: Category, newName: string): Promise<Category> {
        category.name = newName;
        return this.ormRepository.save(category);
    }

}
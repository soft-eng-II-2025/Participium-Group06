import { Category } from "../models/Category";
import { Role } from "../models/Role";
import { Repository, DataSource } from "typeorm";

export class CategoryRepository {
    protected ormRepository: Repository<Category>;
    protected roleRepository: Repository<Role>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(Category);
        this.roleRepository = dataSource.getRepository(Role);
    }

    /** Get all categories (no relations) */
    async findAll(): Promise<Category[]> {
        return this.ormRepository.find();
    }

    /** Get all categories with assigned roles */
    async findWithRoles(): Promise<Category[]> {
        return this.ormRepository.find({ relations: ["roles"] });
    }

    /** Find category by name */
    async findByName(name: string): Promise<Category | null> {
        return this.ormRepository.findOne({
            where: { name },
            relations: ["roles"]
        });
    }

    /** Find category by ID */
    async findById(id: number): Promise<Category | null> {
        return this.ormRepository.findOne({
            where: { id },
            relations: ["roles"]
        });
    }

    /** Add a new category */
    async add(category: Category): Promise<Category> {
        return this.ormRepository.save(category);
    }

    /** Remove a category */
    async remove(category: Category): Promise<void> {
        await this.ormRepository.remove(category);
    }

    /** Change category name */
    async changeName(category: Category, newName: string): Promise<Category> {
        category.name = newName;
        return this.ormRepository.save(category);
    }

    /** 
     * Find categories assigned to a specific role 
     */
    async findByRoleId(roleId: number): Promise<Category[]> {
        return this.ormRepository
            .createQueryBuilder("category")
            .innerJoin("category.roles", "role", "role.id = :roleId", { roleId })
            .getMany();
    }

    /**
     * Assign a role to a category
     */
    async addRoleToCategory(categoryId: number, roleId: number): Promise<void> {
        const category = await this.findById(categoryId);
        const role = await this.roleRepository.findOneBy({ id: roleId });

        if (!category || !role) {
            throw new Error("Category or Role not found");
        }

        // Ensure roles array exists
        category.roles = category.roles ?? [];

        if (!category.roles.find(r => r.id === roleId)) {
            category.roles.push(role);
            await this.ormRepository.save(category);
        }
    }

    /**
     * Remove a role from a category
     */
    async removeRoleFromCategory(categoryId: number, roleId: number): Promise<void> {
        const category = await this.findById(categoryId);
        if (!category) throw new Error("Category not found");

        category.roles = (category.roles ?? []).filter(role => role.id !== roleId);
        await this.ormRepository.save(category);
    }

    /**
     * Replace all roles assigned to a category
     */
    async replaceCategoryRoles(categoryId: number, roleIds: number[]): Promise<void> {
        const category = await this.findById(categoryId);
        if (!category) throw new Error("Category not found");

        const roles = await this.roleRepository.findBy({ id: roleIds as any });
        category.roles = roles;

        await this.ormRepository.save(category);
    }
}

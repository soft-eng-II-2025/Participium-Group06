// src/repositories/RoleRepository.ts
import { Role } from "../models/Role";
import { Category } from "../models/Category";
import { Repository, DataSource, In } from "typeorm";

export class RoleRepository {
    protected ormRepository: Repository<Role>;
    protected categoryRepository: Repository<Category>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(Role);
        this.categoryRepository = dataSource.getRepository(Category);
    }

    /** Get all roles (no relations) */
    findAll(): Promise<Role[]> {
        return this.ormRepository.find();
    }

    /** Get all roles including assigned categories */
    findAllWithCategories(): Promise<Role[]> {
        return this.ormRepository.find({
            relations: ["categories"],
        });
    }

    /** Get a single role by title (with categories) */
    findByTitle(title: string): Promise<Role | null> {
        return this.ormRepository.findOne({
            where: { title },
            relations: ["categories"],
        });
    }

    /** Get a single role by ID (with categories) */
    findById(id: number): Promise<Role | null> {
        return this.ormRepository.findOne({
            where: { id },
            relations: ["categories"],
        });
    }

    /** Assignable roles: exclude admin/super admin */
    findAssignable(): Promise<Role[]> {
        return this.ormRepository
            .createQueryBuilder("r")
            .where("LOWER(r.title) NOT IN (:...bad)", {
                bad: ["admin", "super admin"],
            })
            .getMany();
    }

    /** Create/update a role */
    async add(role: Role): Promise<Role> {
        return this.ormRepository.save(role);
    }

    /** Delete role */
    async remove(role: Role): Promise<void> {
        await this.ormRepository.remove(role);
    }

    // -------------------------------------------------------------
    // NEW Many-to-Many Management
    // -------------------------------------------------------------

    /** Assign a category to a role */
    async addCategoryToRole(roleId: number, categoryId: number): Promise<void> {
        const role = await this.findById(roleId);
        const category = await this.categoryRepository.findOneBy({ id: categoryId });

        if (!role || !category) throw new Error("Role or Category not found");

        role.categories = role.categories ?? [];

        if (!role.categories.find(c => c.id === categoryId)) {
            role.categories.push(category);
            await this.ormRepository.save(role);
        }
    }

    /** Remove a category from a role */
    async removeCategoryFromRole(roleId: number, categoryId: number): Promise<void> {
        const role = await this.findById(roleId);
        if (!role) throw new Error("Role not found");

        role.categories = (role.categories ?? []).filter(c => c.id !== categoryId);
        await this.ormRepository.save(role);
    }

    /** Replace all categories for a role */
    async replaceRoleCategories(roleId: number, categoryIds: number[]): Promise<void> {
        const role = await this.findById(roleId);
        if (!role) throw new Error("Role not found");

        const categories = await this.categoryRepository.findBy({ id: In(categoryIds) });
        role.categories = categories;

        await this.ormRepository.save(role);
    }

    /** Get all categories assigned to a role */
    async findCategoriesForRole(roleId: number): Promise<Category[]> {
        const role = await this.findById(roleId);
        if (!role) throw new Error("Role not found");
        return role.categories ?? [];
    }
}

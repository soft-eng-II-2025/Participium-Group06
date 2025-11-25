// src/tests/integration/repositories/RoleRepository.int.test.ts

import { DataSource } from "typeorm";
import { RoleRepository } from "../../../repositories/RoleRepository";
import { TestDataSource } from "../../test-data-source";
import { Role } from "../../../models/Role";
import { Category } from "../../../models/Category";

describe("RoleRepository (Integration Tests)", () => {
  let repository: RoleRepository;

  // beforeAll: Questo setup viene eseguito una sola volta all'inizio.
  // Inizializza la connessione al database di test.
  beforeAll(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
  });

  // afterAll: Questo teardown viene eseguito una sola volta alla fine.
  // Distrugge la connessione al database di test.
  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  // beforeEach: Questo setup viene eseguito prima di ogni test.
  // 1. Garantisce un ambiente pulito ricreando lo schema del DB.
  // 2. Crea una nuova istanza del RoleRepository.
  beforeEach(async () => {
    // Assicurati che la connessione sia attiva prima di sincronizzare.
    if (!TestDataSource.isInitialized) {
      throw new Error("TestDataSource should be initialized in beforeAll.");
    }
    await TestDataSource.synchronize(true); // Ricrea lo schema
    repository = new RoleRepository(TestDataSource);
  });

  describe("findAll", () => {
    it("should return all roles", async () => {
      // Popola il database con alcuni dati di test.
      await TestDataSource.getRepository(Role).save([
        { title: "Admin", label: "Administrator" },
        { title: "User", label: "Regular User" },
      ]);

      const roles = await repository.findAll();

      expect(roles).toHaveLength(2); // Verifica che siano state recuperate due entità.
      expect(roles[0].title).toBe("Admin");
      expect(roles[1].title).toBe("User");
    });

    it("should return an empty array if no roles exist", async () => {
      const roles = await repository.findAll();
      expect(roles).toHaveLength(0); // Verifica che l'array sia vuoto.
    });
  });

  describe("findAllWithCategories", () => {
    it("should return all roles with their assigned categories", async () => {
      const category1 = await TestDataSource.getRepository(Category).save({
        name: "Category 1",
      });
      const category2 = await TestDataSource.getRepository(Category).save({
        name: "Category 2",
      });

      await TestDataSource.getRepository(Role).save([
        { title: "Role A", label: "Label A", categories: [category1] },
        { title: "Role B", label: "Label B", categories: [category1, category2] },
      ]);

      const roles = await repository.findAllWithCategories();

      expect(roles).toHaveLength(2);

      const foundRoleA = roles.find((r) => r.title === "Role A");
      const foundRoleB = roles.find((r) => r.title === "Role B");

      expect(foundRoleA).toBeDefined();
      expect(foundRoleA?.categories).toHaveLength(1);
      expect(foundRoleA?.categories[0].name).toBe("Category 1");

      expect(foundRoleB).toBeDefined();
      expect(foundRoleB?.categories).toHaveLength(2);
      expect(foundRoleB?.categories.map((c) => c.name)).toEqual(
        expect.arrayContaining(["Category 1", "Category 2"])
      );
    });

    it("should return roles with no categories if none are assigned", async () => {
      await TestDataSource.getRepository(Role).save({
        title: "Role No Categories",
        label: "Label No Categories",
      });

      const roles = await repository.findAllWithCategories();

      expect(roles).toHaveLength(1);
      expect(roles[0].title).toBe("Role No Categories");
      expect(roles[0].categories).toHaveLength(0);
    });
  });

  describe("findByTitle", () => {
    it("should return a role by its title with categories", async () => {
      const category = await TestDataSource.getRepository(Category).save({
        name: "Test Category",
      });
      await TestDataSource.getRepository(Role).save({
        title: "Unique Role",
        label: "Unique Label",
        categories: [category],
      });

      const foundRole = await repository.findByTitle("Unique Role");

      expect(foundRole).toBeDefined();
      expect(foundRole?.title).toBe("Unique Role");
      expect(foundRole?.categories).toHaveLength(1);
      expect(foundRole?.categories[0].name).toBe("Test Category");
    });

    it("should return null if role title does not exist", async () => {
      const foundRole = await repository.findByTitle("NonExistent");
      expect(foundRole).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return a role by its ID with categories", async () => {
      const category = await TestDataSource.getRepository(Category).save({
        name: "ID Category",
      });
      const savedRole = await TestDataSource.getRepository(Role).save({
        title: "ID Role",
        label: "ID Label",
        categories: [category],
      });

      const foundRole = await repository.findById(savedRole.id);

      expect(foundRole).toBeDefined();
      expect(foundRole?.id).toBe(savedRole.id);
      expect(foundRole?.title).toBe("ID Role");
      expect(foundRole?.categories).toHaveLength(1);
      expect(foundRole?.categories[0].name).toBe("ID Category");
    });

    it("should return null if role ID does not exist", async () => {
      const foundRole = await repository.findById(999);
      expect(foundRole).toBeNull();
    });
  });

  describe("findAssignable", () => {
    it("should return all roles except 'admin' and 'super admin'", async () => {
      await TestDataSource.getRepository(Role).save([
        { title: "Admin", label: "Administrator" },
        { title: "Super Admin", label: "Super Administrator" },
        { title: "Editor", label: "Content Editor" },
        { title: "Viewer", label: "Viewer" },
      ]);

      const assignableRoles = await repository.findAssignable();

      expect(assignableRoles).toHaveLength(2);
      expect(assignableRoles.map((r) => r.title)).toEqual(
        expect.arrayContaining(["Editor", "Viewer"])
      );
      expect(assignableRoles.map((r) => r.title)).not.toContain("Admin");
      expect(assignableRoles.map((r) => r.title)).not.toContain("Super Admin");
    });

    it("should return an empty array if only unassignable roles exist", async () => {
      await TestDataSource.getRepository(Role).save([
        { title: "Admin", label: "Administrator" },
        { title: "Super Admin", label: "Super Administrator" },
      ]);

      const assignableRoles = await repository.findAssignable();
      expect(assignableRoles).toHaveLength(0);
    });
  });

  describe("add", () => {
    it("should add a new role", async () => {
      const newRole = new Role();
      newRole.title = "New Role";
      newRole.label = "New Label";

      const addedRole = await repository.add(newRole);

      expect(addedRole).toBeDefined();
      expect(addedRole.id).toBeDefined();
      expect(addedRole.title).toBe("New Role");

      const found = await repository.findById(addedRole.id);
      expect(found).toBeDefined();
      expect(found?.label).toBe("New Label");
    });
  });

  describe("remove", () => {
    it("should remove a role", async () => {
      const roleToRemove = await TestDataSource.getRepository(Role).save({
        title: "To Be Removed",
        label: "Label To Be Removed",
      });

      await repository.remove(roleToRemove);

      const found = await repository.findById(roleToRemove.id);
      expect(found).toBeNull();
    });
  });

  describe("addCategoryToRole", () => {
    it("should assign a category to a role", async () => {
      const category = await TestDataSource.getRepository(Category).save({
        name: "New Assign Category",
      });
      const role = await TestDataSource.getRepository(Role).save({
        title: "Role For Category",
        label: "Label For Category",
      });

      await repository.addCategoryToRole(role.id, category.id);

      const updatedRole = await repository.findById(role.id);
      expect(updatedRole).toBeDefined();
      expect(updatedRole?.categories).toHaveLength(1);
      expect(updatedRole?.categories[0].name).toBe("New Assign Category");
    });

    it("should not add a category if it's already assigned", async () => {
      const category = await TestDataSource.getRepository(Category).save({
        name: "Existing Category",
      });
      const role = await TestDataSource.getRepository(Role).save({
        title: "Role With Category",
        label: "Label With Category",
        categories: [category],
      });

      await repository.addCategoryToRole(role.id, category.id);

      const updatedRole = await repository.findById(role.id);
      expect(updatedRole).toBeDefined();
      expect(updatedRole?.categories).toHaveLength(1); // Still 1
      expect(updatedRole?.categories[0].name).toBe("Existing Category");
    });

    it("should throw an error if role or category not found", async () => {
      const category = await TestDataSource.getRepository(Category).save({ name: 'C' });
      const role = await TestDataSource.getRepository(Role).save({ title: 'R', label: 'L' });

      await expect(repository.addCategoryToRole(999, category.id)).rejects.toThrow("Role or Category not found");
      await expect(repository.addCategoryToRole(role.id, 999)).rejects.toThrow("Role or Category not found");
      await expect(repository.addCategoryToRole(999, 999)).rejects.toThrow("Role or Category not found");
    });
  });

  describe("removeCategoryFromRole", () => {
    it("should remove a category from a role", async () => {
      const categoryToRemove = await TestDataSource.getRepository(Category).save({
        name: "Category To Remove",
      });
      const categoryToKeep = await TestDataSource.getRepository(Category).save({
        name: "Category To Keep",
      });
      const role = await TestDataSource.getRepository(Role).save({
        title: "Role For Category Removal",
        label: "Label For Category Removal",
        categories: [categoryToRemove, categoryToKeep],
      });

      await repository.removeCategoryFromRole(role.id, categoryToRemove.id);

      const updatedRole = await repository.findById(role.id);
      expect(updatedRole).toBeDefined();
      expect(updatedRole?.categories).toHaveLength(1);
      expect(updatedRole?.categories[0].name).toBe("Category To Keep");
    });

    it("should do nothing if category is not assigned to role", async () => {
      const category = await TestDataSource.getRepository(Category).save({
        name: "Some Category",
      });
      const otherCategory = await TestDataSource.getRepository(Category).save({
        name: "Other Category",
      });
      const role = await TestDataSource.getRepository(Role).save({
        title: "Role For No Removal",
        label: "Label For No Removal",
        categories: [otherCategory],
      });

      await repository.removeCategoryFromRole(role.id, category.id);

      const updatedRole = await repository.findById(role.id);
      expect(updatedRole).toBeDefined();
      expect(updatedRole?.categories).toHaveLength(1);
      expect(updatedRole?.categories[0].name).toBe("Other Category");
    });

    it("should throw an error if role not found", async () => {
        await expect(repository.removeCategoryFromRole(999, 1)).rejects.toThrow("Role not found");
    });
  });

  describe("replaceRoleCategories", () => {
    it("should throw an error if role not found", async () => {
        const category = await TestDataSource.getRepository(Category).save({ name: 'C' });
        await expect(repository.replaceRoleCategories(999, [category.id])).rejects.toThrow("Role not found");
    });
  });

  describe("findCategoriesForRole", () => {
    it("should return all categories assigned to a role", async () => {
      const category1 = await TestDataSource.getRepository(Category).save({
        name: "Cat1",
      });
      const category2 = await TestDataSource.getRepository(Category).save({
        name: "Cat2",
      });
      const role = await TestDataSource.getRepository(Role).save({
        title: "Role with Cats",
        label: "Role with Categories",
        categories: [category1, category2],
      });

      const categories = await repository.findCategoriesForRole(role.id);

      expect(categories).toHaveLength(2);
      expect(categories.map(c => c.name)).toEqual(expect.arrayContaining(["Cat1", "Cat2"]));
    });

    it("should return an empty array if no categories are assigned", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Role no Cats",
        label: "Role without Categories",
      });

      const categories = await repository.findCategoriesForRole(role.id);

      expect(categories).toHaveLength(0);
    });

    it("should throw an error if role not found", async () => {
        await expect(repository.findCategoriesForRole(999)).rejects.toThrow("Role not found");
    });
  });
});
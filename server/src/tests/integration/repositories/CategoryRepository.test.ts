// src/tests/integration/repositories/CategoryRepository.int.test.ts

import { DataSource } from "typeorm";
import { CategoryRepository } from "../../../repositories/CategoryRepository";
import { TestDataSource } from "../../test-data-source";
import { Category } from "../../../models/Category";
import { Role } from "../../../models/Role";

describe("CategoryRepository (Integration Tests)", () => {
  let repository: CategoryRepository;

  // afterAll gestito da src/tests/integration/setup-db.ts

  // Il beforeEach qui si assicura che il TestDataSource sia inizializzato e sincronizzato
  // prima di ogni singolo test, e crea l'istanza del repository.
  beforeEach(async () => { // <--- ATTENZIONE: PRIMA ERA beforeAll PER LA CREAZIONE DEL REPO
    if (!TestDataSource.isInitialized) {
      // Questo scenario non dovrebbe avvenire se setup-db.ts è configurato correttamente
      // ma è una safety check.
      // Se il problema persiste qui, significa che setup-db.ts non sta inizializzando il DS.
      await TestDataSource.initialize();
    }
    // Ogni test parte con un DB pulito
    await TestDataSource.synchronize(true);
    repository = new CategoryRepository(TestDataSource);
  });

  describe("findAll", () => {
    it("should return all categories", async () => {
      await TestDataSource.getRepository(Category).save([
        { name: "Category 1" },
        { name: "Category 2" },
      ]);

      const categories = await repository.findAll();

      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe("Category 1");
      expect(categories[1].name).toBe("Category 2");
    });

    it("should return an empty array if no categories exist", async () => {
      const categories = await repository.findAll();
      expect(categories).toHaveLength(0);
    });
  });

  describe("findWithRoles", () => {
    it("should return all categories with their roles", async () => {
      const role1 = await TestDataSource.getRepository(Role).save({
        title: "Role 1",
        label: "Label 1",
      });
      const role2 = await TestDataSource.getRepository(Role).save({
        title: "Role 2",
        label: "Label 2",
      });

      const category1 = await TestDataSource.getRepository(Category).save({
        name: "Category A",
        roles: [role1],
      });
      const category2 = await TestDataSource.getRepository(Category).save({
        name: "Category B",
        roles: [role1, role2],
      });

      const categories = await repository.findWithRoles();

      expect(categories).toHaveLength(2);

      const foundCategoryA = categories.find((c) => c.name === "Category A");
      const foundCategoryB = categories.find((c) => c.name === "Category B");

      expect(foundCategoryA).toBeDefined();
      expect(foundCategoryA?.roles).toHaveLength(1);
      expect(foundCategoryA?.roles[0].title).toBe("Role 1");

      expect(foundCategoryB).toBeDefined();
      expect(foundCategoryB?.roles).toHaveLength(2);
      expect(foundCategoryB?.roles.map((r) => r.title)).toEqual(
        expect.arrayContaining(["Role 1", "Role 2"])
      );
    });

    it("should return categories with no roles if no roles are assigned", async () => {
      await TestDataSource.getRepository(Category).save({
        name: "Category No Roles",
      });

      const categories = await repository.findWithRoles();

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Category No Roles");
      expect(categories[0].roles).toHaveLength(0);
    });
  });

  describe("findByName", () => {
    it("should return a category by its name with roles", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Test Role",
        label: "Test Label",
      });
      await TestDataSource.getRepository(Category).save({
        name: "Unique Category",
        roles: [role],
      });

      const foundCategory = await repository.findByName("Unique Category");

      expect(foundCategory).toBeDefined();
      expect(foundCategory?.name).toBe("Unique Category");
      expect(foundCategory?.roles).toHaveLength(1);
      expect(foundCategory?.roles[0].title).toBe("Test Role");
    });

    it("should return null if category name does not exist", async () => {
      const foundCategory = await repository.findByName("NonExistent");
      expect(foundCategory).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return a category by its ID with roles", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Another Role",
        label: "Another Label",
      });
      const savedCategory = await TestDataSource.getRepository(Category).save({
        name: "ID Category",
        roles: [role],
      });

      const foundCategory = await repository.findById(savedCategory.id);

      expect(foundCategory).toBeDefined();
      expect(foundCategory?.id).toBe(savedCategory.id);
      expect(foundCategory?.name).toBe("ID Category");
      expect(foundCategory?.roles).toHaveLength(1);
      expect(foundCategory?.roles[0].title).toBe("Another Role");
    });

    it("should return null if category ID does not exist", async () => {
      const foundCategory = await repository.findById(999);
      expect(foundCategory).toBeNull();
    });
  });

  describe("add", () => {
    it("should add a new category", async () => {
      const newCategory = new Category();
      newCategory.name = "New Category";

      const addedCategory = await repository.add(newCategory);

      expect(addedCategory).toBeDefined();
      expect(addedCategory.id).toBeDefined();
      expect(addedCategory.name).toBe("New Category");

      const found = await repository.findById(addedCategory.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("New Category");
    });
  });

  describe("remove", () => {
    it("should remove a category", async () => {
      const categoryToRemove = await TestDataSource.getRepository(Category).save({
        name: "To Be Removed",
      });

      await repository.remove(categoryToRemove);

      const found = await repository.findById(categoryToRemove.id);
      expect(found).toBeNull();
    });
  });

  describe("changeName", () => {
    it("should change a category's name", async () => {
      const categoryToUpdate = await TestDataSource.getRepository(Category).save({
        name: "Old Name",
      });

      const updatedCategory = await repository.changeName(
        categoryToUpdate,
        "New Name"
      );

      expect(updatedCategory).toBeDefined();
      expect(updatedCategory.name).toBe("New Name");
      expect(updatedCategory.id).toBe(categoryToUpdate.id);

      const found = await repository.findById(categoryToUpdate.id);
      expect(found?.name).toBe("New Name");
    });
  });

  describe("findByRoleId", () => {
    it("should return categories assigned to a specific role", async () => {
      const role1 = await TestDataSource.getRepository(Role).save({
        title: "Role A",
        label: "Label A",
      });
      const role2 = await TestDataSource.getRepository(Role).save({
        title: "Role B",
        label: "Label B",
      });

      const category1 = await TestDataSource.getRepository(Category).save({
        name: "Cat1",
        roles: [role1],
      });
      const category2 = await TestDataSource.getRepository(Category).save({
        name: "Cat2",
        roles: [role1, role2],
      });
      await TestDataSource.getRepository(Category).save({ name: "Cat3", roles: [role2] });

      const categories = await repository.findByRoleId(role1.id);

      expect(categories).toHaveLength(2);
      expect(categories.map((c) => c.name)).toEqual(
        expect.arrayContaining(["Cat1", "Cat2"])
      );
    });

    it("should return an empty array if no categories are assigned to the role", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Unused Role",
        label: "Unused Label",
      });
      await TestDataSource.getRepository(Category).save({ name: "Cat1" });

      const categories = await repository.findByRoleId(role.id);

      expect(categories).toHaveLength(0);
    });
  });

  describe("addRoleToCategory", () => {
    it("should assign a role to a category", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "New Assign Role",
        label: "New Assign Label",
      });
      const category = await TestDataSource.getRepository(Category).save({
        name: "Category For Role",
      });

      await repository.addRoleToCategory(category.id, role.id);

      const updatedCategory = await repository.findById(category.id);
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.roles).toHaveLength(1);
      expect(updatedCategory?.roles[0].title).toBe("New Assign Role");
    });

    it("should not add a role if it's already assigned", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Existing Role",
        label: "Existing Label",
      });
      const category = await TestDataSource.getRepository(Category).save({
        name: "Category With Role",
        roles: [role],
      });

      await repository.addRoleToCategory(category.id, role.id);

      const updatedCategory = await repository.findById(category.id);
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.roles).toHaveLength(1);
      expect(updatedCategory?.roles[0].title).toBe("Existing Role");
    });

    it("should throw an error if category or role not found", async () => {
      const role = await TestDataSource.getRepository(Role).save({ title: 'R', label: 'L' });
      const category = await TestDataSource.getRepository(Category).save({ name: 'C' });

      await expect(repository.addRoleToCategory(999, role.id)).rejects.toThrow("Category or Role not found");
      await expect(repository.addRoleToCategory(category.id, 999)).rejects.toThrow("Category or Role not found");
      await expect(repository.addRoleToCategory(999, 999)).rejects.toThrow("Category or Role not found");
    });
  });

  describe("removeRoleFromCategory", () => {
    it("should remove a role from a category", async () => {
      const roleToRemove = await TestDataSource.getRepository(Role).save({
        title: "Role To Remove",
        label: "Label To Remove",
      });
      const roleToKeep = await TestDataSource.getRepository(Role).save({
        title: "Role To Keep",
        label: "Label To Keep",
      });
      const category = await TestDataSource.getRepository(Category).save({
        name: "Category For Role Removal",
        roles: [roleToRemove, roleToKeep],
      });

      await repository.removeRoleFromCategory(category.id, roleToRemove.id);

      const updatedCategory = await repository.findById(category.id);
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.roles).toHaveLength(1);
      expect(updatedCategory?.roles[0].title).toBe("Role To Keep");
    });

    it("should do nothing if role is not assigned to category", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Some Role",
        label: "Some Label",
      });
      const otherRole = await TestDataSource.getRepository(Role).save({
        title: "Other Role",
        label: "Other Label",
      });
      const category = await TestDataSource.getRepository(Category).save({
        name: "Category For No Removal",
        roles: [otherRole],
      });

      await repository.removeRoleFromCategory(category.id, role.id);

      const updatedCategory = await repository.findById(category.id);
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory?.roles).toHaveLength(1);
      expect(updatedCategory?.roles[0].title).toBe("Other Role");
    });

    it("should throw an error if category not found", async () => {
        await expect(repository.removeRoleFromCategory(999, 1)).rejects.toThrow("Category not found");
    });
  });

  describe("replaceCategoryRoles", () => {

    it("should throw an error if category not found", async () => {
        const role = await TestDataSource.getRepository(Role).save({ title: 'R', label: 'L' });
        await expect(repository.replaceCategoryRoles(999, [role.id])).rejects.toThrow("Category not found");
    });
  });
});
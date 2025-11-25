// src/tests/integration/repositories/MunicipalityOfficerRepository.int.test.ts

import { DataSource } from "typeorm";
import { MunicipalityOfficerRepository } from "../../../repositories/MunicipalityOfficerRepository";
import { TestDataSource } from "../../test-data-source"; // Path corretto al TestDataSource
import { Role } from "../../../models/Role";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";

describe("MunicipalityOfficerRepository (Integration Tests)", () => {
  let repository: MunicipalityOfficerRepository;

  // *** SETUP DIRETTO NEL FILE DI TEST PER ESCLUDERE INTERFERENZE ESTERNE ***

  beforeAll(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
    // Creiamo il repository una volta per tutti i test.
    // L'inizializzazione del DataSource è qui, quindi non ci sarà più problema di "not initialized".
    repository = new MunicipalityOfficerRepository(TestDataSource);
  });

  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Prima di ogni test, ricreiamo lo schema per isolare i test.
    // Questo è il punto chiave per evitare FK e unique constraint errors.
    if (!TestDataSource.isInitialized) {
        throw new Error("TestDataSource should be initialized in beforeAll.");
    }
    await TestDataSource.synchronize(true); // drop schema e ricrea
  });

  // *** FINE SETUP DIRETTO ***


  describe("findAll", () => {
    it("should return all municipality officers with their roles", async () => {
      const role1 = await TestDataSource.getRepository(Role).save({
        title: "Admin",
        label: "Administrator",
      });

      const role2 = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      await repository.add({
        username: "officer1",
        email: "officer1@example.com",
        password: "password",
        first_name: "John",
        last_name: "Doe",
        role: role1,
      } as MunicipalityOfficer);

      await repository.add({
        username: "officer2",
        email: "officer2@example.com",
        password: "password",
        first_name: "Jane",
        last_name: "Smith",
        role: role2,
      } as MunicipalityOfficer);

      const officers = await repository.findAll();

      expect(officers).toHaveLength(2);
      expect(officers[0].role).toBeDefined();
      expect(officers[0].role?.title).toBe("Admin");
      expect(officers[1].role).toBeDefined();
      expect(officers[1].role?.title).toBe("Officer");

      expect(officers[0]).toEqual(
        expect.objectContaining({
          username: "officer1",
          email: "officer1@example.com",
          role: expect.objectContaining({ title: "Admin" }),
        })
      );
      expect(officers[1]).toEqual(
        expect.objectContaining({
          username: "officer2",
          email: "officer2@example.com",
          role: expect.objectContaining({ title: "Officer" }),
        })
      );
    });

    it("should return an empty array if no officers exist", async () => {
      const officers = await repository.findAll();
      expect(officers).toHaveLength(0);
    });
  });

  describe("findByUsername", () => {
    it("should return the officer with the specified username and their role", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      const officerData = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User",
        role: role,
      };

      await repository.add(officerData as MunicipalityOfficer);

      const foundOfficer = await repository.findByUsername("testuser");

      expect(foundOfficer).toBeDefined();
      expect(foundOfficer?.username).toBe("testuser");
      expect(foundOfficer?.role).toEqual(
        expect.objectContaining({ title: "Officer" })
      );
    });

    it("should return null if no officer with the specified username exists", async () => {
      const foundOfficer = await repository.findByUsername("nonexistent");
      expect(foundOfficer).toBeNull();
    });
  });

  describe("findAllVisible", () => {
    it("should return all officers except the admin user", async () => {
      const adminRole = await TestDataSource.getRepository(Role).save({
        title: "Admin",
        label: "Administrator",
      });

      const officerRole = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      await repository.add({
        username: "admin",
        email: "admin@example.com",
        password: "password",
        first_name: "Super",
        last_name: "Admin",
        role: adminRole,
      } as MunicipalityOfficer);

      await repository.add({
        username: "officer1",
        email: "officer1@example.com",
        password: "password",
        first_name: "John",
        last_name: "Doe",
        role: officerRole,
      } as MunicipalityOfficer);

      const visibleOfficers = await repository.findAllVisible();

      expect(visibleOfficers).toHaveLength(1);
      expect(visibleOfficers[0].username).toBe("officer1");
      expect(visibleOfficers[0].email).toBe("officer1@example.com");
      expect(visibleOfficers[0].role).toEqual(
        expect.objectContaining({ title: "Officer" })
      );
    });

    it("should return an empty array if only admin user exists", async () => {
      const adminRole = await TestDataSource.getRepository(Role).save({
        title: "Admin",
        label: "Administrator",
      });

      await repository.add({
        username: "admin",
        email: "admin@example.com",
        password: "password",
        first_name: "Super",
        last_name: "Admin",
        role: adminRole,
      } as MunicipalityOfficer);

      const visibleOfficers = await repository.findAllVisible();
      expect(visibleOfficers).toHaveLength(0);
    });
  });

  describe("findByEmail", () => {
    it("should return the officer with the specified email", async () => {
      const officerData = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User",
      };

      await repository.add(officerData as MunicipalityOfficer);

      const foundOfficer = await repository.findByEmail("test@example.com");

      expect(foundOfficer).toBeDefined();
      expect(foundOfficer?.email).toBe("test@example.com");
      expect(foundOfficer?.username).toBe("testuser");
    });

    it("should return null if no officer with the specified email exists", async () => {
      const foundOfficer = await repository.findByEmail(
        "nonexistent@example.com"
      );
      expect(foundOfficer).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return the officer with the specified ID and their role", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      const officerData = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User",
        role: role,
      };

      const savedOfficer = await repository.add(
        officerData as MunicipalityOfficer
      );

      const foundOfficer = await repository.findById(savedOfficer.id);

      expect(foundOfficer).toBeDefined();
      expect(foundOfficer?.id).toBe(savedOfficer.id);
      expect(foundOfficer?.username).toBe("testuser");
      expect(foundOfficer?.role).toEqual(
        expect.objectContaining({ title: "Officer" })
      );
    });

    it("should return null if no officer with the specified ID exists", async () => {
      const foundOfficer = await repository.findById(999);
      expect(foundOfficer).toBeNull();
    });
  });

  describe("findByRoleTitle", () => {
    it("should return all officers with the specified role title", async () => {
      const adminRole = await TestDataSource.getRepository(Role).save({
        title: "Admin",
        label: "Administrator",
      });

      const officerRole = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      await repository.add({
        username: "officer1",
        email: "officer1@example.com",
        password: "password",
        first_name: "John",
        last_name: "Doe",
        role: officerRole,
      } as MunicipalityOfficer);

      await repository.add({
        username: "officer2",
        email: "officer2@example.com",
        password: "password",
        first_name: "Jane",
        last_name: "Smith",
        role: adminRole,
      } as MunicipalityOfficer);

      await repository.add({
        username: "officer3",
        email: "officer3@example.com",
        password: "password",
        first_name: "Peter",
        last_name: "Jones",
        role: officerRole,
      } as MunicipalityOfficer);

      const officers = await repository.findByRoleTitle("Officer");

      expect(officers).toHaveLength(2);
      expect(officers.every((o) => o.role?.title === "Officer")).toBeTruthy();
      expect(officers.some((o) => o.username === "officer1")).toBeTruthy();
      expect(officers.some((o) => o.username === "officer3")).toBeTruthy();
    });

    it("should return an empty array if no officers with the specified role title exist", async () => {
      await TestDataSource.getRepository(Role).save({
        title: "UnusedRole",
        label: "Unused Role",
      });

      const officers = await repository.findByRoleTitle("NonExistentRole");
      expect(officers).toHaveLength(0);
    });
  });

  describe("add", () => {
    it("should add a new municipality officer", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      const newOfficer = {
        username: "newofficer",
        email: "newofficer@example.com",
        password: "password",
        first_name: "New",
        last_name: "Officer",
        role: role,
      };

      const addedOfficer = await repository.add(
        newOfficer as MunicipalityOfficer
      );

      expect(addedOfficer).toBeDefined();
      expect(addedOfficer.id).toBeDefined();
      expect(addedOfficer.username).toBe("newofficer");
      expect(addedOfficer.email).toBe("newofficer@example.com");
      expect(addedOfficer.first_name).toBe("New");
      expect(addedOfficer.last_name).toBe("Officer");
      expect(addedOfficer.role).toEqual(expect.objectContaining({ title: "Officer" }));

      const foundOfficer = await repository.findById(addedOfficer.id!);
      expect(foundOfficer).toEqual(
        expect.objectContaining({
          id: addedOfficer.id,
          username: "newofficer",
          email: "newofficer@example.com",
        })
      );
      expect(foundOfficer?.role).toEqual(expect.objectContaining({ title: "Officer" }));
    });
  });

  describe("update", () => {
    it("should update an existing municipality officer", async () => {
      const role = await TestDataSource.getRepository(Role).save({
        title: "Officer",
        label: "Officer",
      });

      const officerData = {
        username: "updateuser",
        email: "update@example.com",
        password: "password",
        first_name: "Update",
        last_name: "User",
        role: role,
      };

      const savedOfficer = await repository.add(
        officerData as MunicipalityOfficer
      );

      savedOfficer.first_name = "Updated";
      savedOfficer.email = "updated@example.com";
      const updatedOfficer = await repository.update(savedOfficer);

      expect(updatedOfficer).toBeDefined();
      expect(updatedOfficer.id).toBe(savedOfficer.id);
      expect(updatedOfficer.first_name).toBe("Updated");
      expect(updatedOfficer.email).toBe("updated@example.com");
      expect(updatedOfficer.username).toBe("updateuser");

      const foundOfficer = await repository.findById(savedOfficer.id!);
      expect(foundOfficer?.first_name).toBe("Updated");
      expect(foundOfficer?.email).toBe("updated@example.com");
      expect(foundOfficer?.role).toEqual(expect.objectContaining({ title: "Officer" }));
    });
  });
});
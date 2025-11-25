// src/tests/integration/repositories/UserRepository.int.test.ts

import { DataSource } from "typeorm";
import { UserRepository } from "../../../repositories/UserRepository";
import { TestDataSource } from "../../test-data-source";
import { User } from "../../../models/User";

describe("UserRepository (Integration Tests)", () => {
  let repository: UserRepository;

  // beforeAll: Eseguito una volta prima di tutti i test in questo describe.
  // Inizializza il TestDataSource.
  beforeAll(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
  });

  // afterAll: Eseguito una volta dopo tutti i test in questo describe.
  // Distrugge il TestDataSource.
  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  // beforeEach: Eseguito prima di ogni singolo test (it).
  // 1. Ricrea lo schema del DB (drop e create) per garantire isolamento.
  // 2. Istanzia il UserRepository.
  beforeEach(async () => {
    // La riga sotto non è strettamente necessaria qui se beforeAll è configurato correttamente,
    // ma può rimanere come ulteriore garanzia/debug.
    if (!TestDataSource.isInitialized) {
      throw new Error("TestDataSource should be initialized in beforeAll.");
    }
    await TestDataSource.synchronize(true); // Drop e ricrea lo schema del DB
    repository = new UserRepository(TestDataSource);
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      await TestDataSource.getRepository(User).save([
        {
          username: "user1",
          email: "user1@example.com",
          password: "pass1",
          first_name: "John",
          last_name: "Doe",
          photo: "photo1.jpg",
          telegram_id: "tg1",
          flag_email: true,
        },
        {
          username: "user2",
          email: "user2@example.com",
          password: "pass2",
          first_name: "Jane",
          last_name: "Smith",
          photo: "photo2.jpg",
          telegram_id: "tg2",
          flag_email: false,
        },
      ]);

      const users = await repository.findAll();

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe("user1");
      expect(users[1].username).toBe("user2");
    });

    it("should return an empty array if no users exist", async () => {
      const users = await repository.findAll();
      expect(users).toHaveLength(0);
    });
  });

  describe("findByUsername", () => {
    it("should return a user by username", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User",
        photo: "photo.jpg",
        telegram_id: "tg_test",
        flag_email: true,
      };
      await TestDataSource.getRepository(User).save(userData);

      const foundUser = await repository.findByUsername("testuser");

      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe("testuser");
    });

    it("should return null if user by username does not exist", async () => {
      const foundUser = await repository.findByUsername("nonexistent");
      expect(foundUser).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return a user by id", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User",
        photo: "photo.jpg",
        telegram_id: "tg_test",
        flag_email: true,
      };
      const savedUser = await TestDataSource.getRepository(User).save(userData);

      const foundUser = await repository.findByid(savedUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(savedUser.id);
    });

    it("should return null if user by id does not exist", async () => {
      const foundUser = await repository.findByid(999);
      expect(foundUser).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return a user by email", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User",
        photo: "photo.jpg",
        telegram_id: "tg_test",
        flag_email: true,
      };
      await TestDataSource.getRepository(User).save(userData);

      const foundUser = await repository.findByEmail("test@example.com");

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe("test@example.com");
    });

    it("should return null if user by email does not exist", async () => {
      const foundUser = await repository.findByEmail("nonexistent@example.com");
      expect(foundUser).toBeNull();
    });
  });

  describe("add", () => {
    it("should add a new user", async () => {
      const newUser = new User();
      newUser.username = "newuser";
      newUser.email = "newuser@example.com";
      newUser.password = "newpass";
      newUser.first_name = "New";
      newUser.last_name = "User";
      newUser.photo = "newphoto.jpg";
      newUser.telegram_id = "new_tg";
      newUser.flag_email = false;

      const addedUser = await repository.add(newUser);

      expect(addedUser).toBeDefined();
      expect(addedUser.id).toBeDefined();
      expect(addedUser.username).toBe("newuser");

      const found = await repository.findByid(addedUser.id);
      expect(found).toBeDefined();
      expect(found?.email).toBe("newuser@example.com");
    });
  });

  describe("remove", () => {
    it("should remove a user", async () => {
      const userToRemove = await TestDataSource.getRepository(User).save({
        username: "toremove",
        email: "toremove@example.com",
        password: "pass",
        first_name: "To",
        last_name: "Remove",
        photo: "p.jpg",
        telegram_id: "tg_r",
        flag_email: true,
      });

      await repository.remove(userToRemove);

      const found = await repository.findByid(userToRemove.id);
      expect(found).toBeNull();
    });
  });

  describe("changePassword", () => {
    it("should change user's password", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "chpass",
        email: "chpass@example.com",
        password: "oldpass",
        first_name: "Ch",
        last_name: "Pass",
        photo: "p.jpg",
        telegram_id: "tg_ch",
        flag_email: true,
      });

      const updatedUser = await repository.changePassword(userToUpdate, "newpass");

      expect(updatedUser.password).toBe("newpass");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.password).toBe("newpass");
    });
  });

  describe("changeEmail", () => {
    it("should change user's email", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "chemail",
        email: "old@example.com",
        password: "pass",
        first_name: "Ch",
        last_name: "Email",
        photo: "p.jpg",
        telegram_id: "tg_ch",
        flag_email: true,
      });

      const updatedUser = await repository.changeEmail(userToUpdate, "new@example.com");

      expect(updatedUser.email).toBe("new@example.com");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.email).toBe("new@example.com");
    });
  });

  describe("changeUsername", () => {
    it("should change user's username", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "olduser",
        email: "user@example.com",
        password: "pass",
        first_name: "Ch",
        last_name: "User",
        photo: "p.jpg",
        telegram_id: "tg_ch",
        flag_email: true,
      });

      const updatedUser = await repository.changeUsername(userToUpdate, "newuser");

      expect(updatedUser.username).toBe("newuser");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.username).toBe("newuser");
    });
  });

  describe("changeLastName", () => {
    it("should change user's last name", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "user",
        email: "user@example.com",
        password: "pass",
        first_name: "Test",
        last_name: "Old",
        photo: "p.jpg",
        telegram_id: "tg_ch",
        flag_email: true,
      });

      const updatedUser = await repository.changeLastName(userToUpdate, "New");

      expect(updatedUser.last_name).toBe("New");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.last_name).toBe("New");
    });
  });

  describe("changeFirstName", () => {
    it("should change user's first name", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "user",
        email: "user@example.com",
        password: "pass",
        first_name: "Old",
        last_name: "Test",
        photo: "p.jpg",
        telegram_id: "tg_ch",
        flag_email: true,
      });

      const updatedUser = await repository.changeFirstName(userToUpdate, "New");

      expect(updatedUser.first_name).toBe("New");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.first_name).toBe("New");
    });
  });

  describe("changePhoto", () => {
    it("should change user's photo", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "user",
        email: "user@example.com",
        password: "pass",
        first_name: "Test",
        last_name: "Test",
        photo: "old.jpg",
        telegram_id: "tg_ch",
        flag_email: true,
      });

      const updatedUser = await repository.changePhoto(userToUpdate, "new.jpg");

      expect(updatedUser.photo).toBe("new.jpg");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.photo).toBe("new.jpg");
    });
  });

  describe("changeTelegramId", () => {
    it("should change user's telegram ID", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "user",
        email: "user@example.com",
        password: "pass",
        first_name: "Test",
        last_name: "Test",
        photo: "p.jpg",
        telegram_id: "old_tg",
        flag_email: true,
      });

      const updatedUser = await repository.changeTelegramId(userToUpdate, "new_tg");

      expect(updatedUser.telegram_id).toBe("new_tg");
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.telegram_id).toBe("new_tg");
    });
  });

  describe("changeFlagEmail", () => {
    it("should change user's flag_email", async () => {
      const userToUpdate = await TestDataSource.getRepository(User).save({
        username: "user",
        email: "user@example.com",
        password: "pass",
        first_name: "Test",
        last_name: "Test",
        photo: "p.jpg",
        telegram_id: "tg_ch",
        flag_email: false,
      });

      const updatedUser = await repository.changeFlagEmail(userToUpdate, true);

      expect(updatedUser.flag_email).toBe(true);
      const found = await repository.findByid(userToUpdate.id);
      expect(found?.flag_email).toBe(true);
    });
  });
});
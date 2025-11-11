import { TestDataSource } from "../../test-data-source";
import { User } from "../../../models/User";
import { UserRepository } from "../../../repositories/UserRepository";

describe("UserRepository (integration)", () => {
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Inizializza il DB di test (SQLite in-memory)
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
    userRepository = new UserRepository();
    // Sostituiamo la connessione principale con quella di test
    (userRepository as any).ormRepository = TestDataSource.getRepository(User);
  });

  beforeEach(async () => {
    // Reset DB prima di ogni test
    await TestDataSource.synchronize(true);
  });

  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  it("aggiunge e trova un utente per email", async () => {
    const user = new User();
    user.username = "mario";
    user.email = "mario@mail.com";
    user.password = "1234";
    user.first_name = "Mario";
    user.last_name = "Rossi";

    await userRepository.add(user);

    const found = await userRepository.findByEmail("mario@mail.com");
    expect(found).not.toBeNull();
    expect(found?.username).toBe("mario");
  });

  it("trova un utente per username", async () => {
    const user = new User();
    user.username = "luigi";
    user.email = "luigi@mail.com";
    user.password = "abcd";
    user.first_name = "Luigi";
    user.last_name = "Bianchi";

    await userRepository.add(user);

    const found = await userRepository.findByUsername("luigi");
    expect(found).not.toBeNull();
    expect(found?.email).toBe("luigi@mail.com");
  });

  it("modifica la password", async () => {
    const user = new User();
    user.username = "anna";
    user.email = "anna@mail.com";
    user.password = "oldpass";
    user.first_name = "Anna";
    user.last_name = "Verdi";

    const saved = await userRepository.add(user);
    const updated = await userRepository.changePassword(saved, "newpass");

    expect(updated.password).toBe("newpass");
  });

  it("modifica username ed email", async () => {
    const user = new User();
    user.username = "carlo";
    user.email = "carlo@mail.com";
    user.password = "1234";
    user.first_name = "Carlo";
    user.last_name = "Neri";

    const saved = await userRepository.add(user);
    await userRepository.changeUsername(saved, "carlo_nuovo");
    await userRepository.changeEmail(saved, "carlo_new@mail.com");

    const updated = await userRepository.findByUsername("carlo_nuovo");
    expect(updated?.email).toBe("carlo_new@mail.com");
  });

  it("rimuove un utente", async () => {
    const user = new User();
    user.username = "gigi";
    user.email = "gigi@mail.com";
    user.password = "secret";
    user.first_name = "Gigi";
    user.last_name = "Blu";

    const saved = await userRepository.add(user);
    await userRepository.remove(saved);

    const found = await userRepository.findByEmail("gigi@mail.com");
    expect(found).toBeNull();
  });
});

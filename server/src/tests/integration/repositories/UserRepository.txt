// src/tests/integration/repositories/UserRepository.test.ts
import { TestDataSource } from '../../test-data-source'; // Percorso relativo a test-data-source.ts
import { UserRepository } from '../../../repositories/UserRepository'; // Percorso relativo a UserRepository
import { User } from '../../../models/User';

describe('UserRepository (integration)', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    // Pulisce tutte le entità prima di ogni test per garantire isolamento
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM "${entity.tableName}"`); // Assicurati che i nomi delle tabelle siano corretti, o usa clear()
      // Alternativa più sicura (ma richiede più chiamate):
      // await repository.clear();
    }

    // Inizializza UserRepository con il TestDataSource
    userRepository = new UserRepository(TestDataSource);
  });

  // --- Test per i metodi di UserRepository ---

  it('dovrebbe aggiungere e trovare un utente per email', async () => {
    const user = new User();
    user.username = 'testuser1';
    user.email = 'test1@example.com';
    user.password = 'password123';
    user.first_name = 'Nome';
    user.last_name = 'Cognome';

    const savedUser = await userRepository.add(user);

    expect(savedUser).toBeDefined();
    expect(savedUser.id).toBeDefined();
    expect(savedUser.username).toBe('testuser1');

    const foundUser = await userRepository.findByEmail('test1@example.com');
    expect(foundUser).not.toBeNull();
    expect(foundUser?.username).toBe('testuser1');
    expect(foundUser?.email).toBe('test1@example.com');
  });

  it('dovrebbe trovare un utente per username', async () => {
    const user = new User();
    user.username = 'testuser2';
    user.email = 'test2@example.com';
    user.password = 'password123';
    user.first_name = 'Altro';
    user.last_name = 'Utente';

    await userRepository.add(user);

    const foundUser = await userRepository.findByUsername('testuser2');
    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe('test2@example.com');
  });

  it('dovrebbe trovare tutti gli utenti', async () => {
    const user1 = new User();
    user1.username = 'alluser1';
    user1.email = 'all1@example.com';
    user1.password = 'pass1';
    user1.first_name = 'Primo';
    user1.last_name = 'Utente';
    await userRepository.add(user1);

    const user2 = new User();
    user2.username = 'alluser2';
    user2.email = 'all2@example.com';
    user2.password = 'pass2';
    user2.first_name = 'Secondo';
    user2.last_name = 'Utente';
    await userRepository.add(user2);

    const users = await userRepository.findAll();
    expect(users).toBeDefined();
    expect(users.length).toBe(2);
    expect(users.some(u => u.username === 'alluser1')).toBe(true);
    expect(users.some(u => u.username === 'alluser2')).toBe(true);
  });

  it('dovrebbe aggiornare la password di un utente', async () => {
    const user = new User();
    user.username = 'passuser';
    user.email = 'pass@example.com';
    user.password = 'oldpass';
    user.first_name = 'Pass';
    user.last_name = 'User';

    const savedUser = await userRepository.add(user);
    const updatedUser = await userRepository.changePassword(savedUser, 'newpass');

    expect(updatedUser.password).toBe('newpass');
    // Verifica anche recuperando dal DB per sicurezza
    const foundUser = await userRepository.findByEmail('pass@example.com');
    expect(foundUser?.password).toBe('newpass');
  });

  it('dovrebbe aggiornare l\'email di un utente', async () => {
    const user = new User();
    user.username = 'emailuser';
    user.email = 'old@example.com';
    user.password = 'pass';
    user.first_name = 'Email';
    user.last_name = 'User';

    const savedUser = await userRepository.add(user);
    const updatedUser = await userRepository.changeEmail(savedUser, 'new@example.com');

    expect(updatedUser.email).toBe('new@example.com');
    const foundUser = await userRepository.findByUsername('emailuser');
    expect(foundUser?.email).toBe('new@example.com');
    // Assicurati che la vecchia email non trovi più l'utente
    const oldEmailFound = await userRepository.findByEmail('old@example.com');
    expect(oldEmailFound).toBeNull();
  });

  it('dovrebbe aggiornare lo username di un utente', async () => {
    const user = new User();
    user.username = 'oldusername';
    user.email = 'user@example.com';
    user.password = 'pass';
    user.first_name = 'User';
    user.last_name = 'Name';

    const savedUser = await userRepository.add(user);
    const updatedUser = await userRepository.changeUsername(savedUser, 'newusername');

    expect(updatedUser.username).toBe('newusername');
    const foundUser = await userRepository.findByEmail('user@example.com');
    expect(foundUser?.username).toBe('newusername');
    // Assicurati che il vecchio username non trovi più l'utente
    const oldUsernameFound = await userRepository.findByUsername('oldusername');
    expect(oldUsernameFound).toBeNull();
  });

  it('dovrebbe aggiornare il cognome di un utente', async () => {
    const user = new User();
    user.username = 'lnameuser';
    user.email = 'lname@example.com';
    user.password = 'pass';
    user.first_name = 'FName';
    user.last_name = 'OldLName';

    const savedUser = await userRepository.add(user);
    const updatedUser = await userRepository.changeLastName(savedUser, 'NewLName');

    expect(updatedUser.last_name).toBe('NewLName');
    const foundUser = await userRepository.findByEmail('lname@example.com');
    expect(foundUser?.last_name).toBe('NewLName');
  });

  it('dovrebbe aggiornare il nome di un utente', async () => {
    const user = new User();
    user.username = 'fnameuser';
    user.email = 'fname@example.com';
    user.password = 'pass';
    user.first_name = 'OldFName';
    user.last_name = 'LName';

    const savedUser = await userRepository.add(user);
    const updatedUser = await userRepository.changeFirstName(savedUser, 'NewFName');

    expect(updatedUser.first_name).toBe('NewFName');
    const foundUser = await userRepository.findByEmail('fname@example.com');
    expect(foundUser?.first_name).toBe('NewFName');
  });

  it('dovrebbe rimuovere un utente', async () => {
    const user = new User();
    user.username = 'removeuser';
    user.email = 'remove@example.com';
    user.password = 'pass';
    user.first_name = 'Remove';
    user.last_name = 'User';

    const savedUser = await userRepository.add(user);
    expect(await userRepository.findByEmail('remove@example.com')).toBeDefined(); // Verifica che sia stato aggiunto

    await userRepository.remove(savedUser);

    const foundUser = await userRepository.findByEmail('remove@example.com');
    expect(foundUser).toBeNull();
  });

  // Test per i vincoli di unicità (se un utente tenta di aggiungere un utente con email/username duplicati)
  it('dovrebbe lanciare un errore se si tenta di aggiungere un utente con email duplicata', async () => {
    const user1 = new User();
    user1.username = 'uniqueuser1';
    user1.email = 'unique@example.com';
    user1.password = 'pass';
    user1.first_name = 'U1';
    user1.last_name = 'U1';
    await userRepository.add(user1);

    const user2 = new User();
    user2.username = 'uniqueuser2'; // Username diverso
    user2.email = 'unique@example.com'; // Email duplicata
    user2.password = 'pass';
    user2.first_name = 'U2';
    user2.last_name = 'U2';

    // TypeORM lancerà un errore per violazione di UNIQUE constraint
    await expect(userRepository.add(user2)).rejects.toThrow();
  });

  it('dovrebbe lanciare un errore se si tenta di aggiungere un utente con username duplicato', async () => {
    const user1 = new User();
    user1.username = 'uniqueusername';
    user1.email = 'unique1@example.com';
    user1.password = 'pass';
    user1.first_name = 'U1';
    user1.last_name = 'U1';
    await userRepository.add(user1);

    const user2 = new User();
    user2.username = 'uniqueusername'; // Username duplicato
    user2.email = 'unique2@example.com'; // Email diversa
    user2.password = 'pass';
    user2.first_name = 'U2';
    user2.last_name = 'U2';

    // TypeORM lancerà un errore per violazione di UNIQUE constraint
    await expect(userRepository.add(user2)).rejects.toThrow();
  });
});
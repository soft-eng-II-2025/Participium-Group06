// src/tests/integration/passwordService.test.ts
/*import { hashPassword, verifyPassword } from '../../../services/passwordService';
// Rimosso l'import di argon2 dal test file perché non ci servono le sue funzioni dirette per i test di integrazione
// e per evitare il TypeError causato dal tentativo di spiare su un'importazione default non configurabile.


describe('passwordService (Integration Tests)', () => {

  const testPassword = 'MySecretPassword123!';
  let hashedPassword: string;

  // beforeAll per generare l'hash una sola volta per tutti i test.
  // Questo riduce il tempo di esecuzione e si concentra sul comportamento di hash/verify
  // anziché sull'unicità dell'hash generato ad ogni beforeEach.
  beforeAll(async () => {
    hashedPassword = await hashPassword(testPassword);
  });

  // beforeEach è ora solo per eventuali pulizie future o per resettare stati,
  // ma per questo servizio non è strettamente necessario a meno di voler resettare hashedPassword.
  // Manteniamo una versione senza beforeEach per semplicità, ma in un caso reale potresti volerlo per isolamento.

  describe('hashPassword', () => {
    it('dovrebbe generare un hash valido e non vuoto', async () => {
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
      expect(hashedPassword).toMatch(/^\$argon2(id|i|d)\$.*$/); // Aggiunto 'd' per argon2d (meno comune ma possibile)
    });

    it('dovrebbe generare hash diversi per la stessa password (per via del salt)', async () => {
      const anotherHashedPassword = await hashPassword(testPassword);
      expect(hashedPassword).not.toBe(anotherHashedPassword);
      // Se questo test fallisce, il salting non funziona o argon2 non è installato correttamente.
      // Verifichiamo che entrambi gli hash siano validi con la password
      expect(await verifyPassword(testPassword, hashedPassword)).toBe(true);
      expect(await verifyPassword(testPassword, anotherHashedPassword)).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('dovrebbe restituire true per una password corretta e un hash valido', async () => {
      const isCorrect = await verifyPassword(testPassword, hashedPassword);
      expect(isCorrect).toBe(true);
    });

    it('dovrebbe restituire false per una password errata', async () => {
      const isIncorrect = await verifyPassword('WrongPassword!', hashedPassword);
      expect(isIncorrect).toBe(false);
    });

    it('dovrebbe restituire false per un hash non valido o malformato', async () => {
      const isInvalidHash = await verifyPassword(testPassword, 'not_a_valid_hash_format');
      expect(isInvalidHash).toBe(false);

      // Un hash che sembra Argon2 ma è stato troncato o corrotto
      const truncatedHash = hashedPassword.substring(0, 10);
      const isTruncatedHash = await verifyPassword(testPassword, truncatedHash);
      expect(isTruncatedHash).toBe(false);
    });

    it('dovrebbe gestire password vuote correttamente', async () => {
      const emptyPassword = '';
      const emptyPasswordHash = await hashPassword(emptyPassword);
      const isEmptyCorrect = await verifyPassword(emptyPassword, emptyPasswordHash);
      expect(isEmptyCorrect).toBe(true);

      const isNonEmptyIncorrect = await verifyPassword('somepass', emptyPasswordHash);
      expect(isNonEmptyIncorrect).toBe(false);
    });
  });

  // Il blocco 'Internal argon2 calls' è stato rimosso per risolvere il TypeError.
  // Testiamo solo il comportamento pubblico di hashPassword e verifyPassword.
});
*/
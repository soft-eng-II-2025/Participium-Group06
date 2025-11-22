// src/tests/setup-dynamic.ts
import path from 'path';

const testPath = process.env.JEST_TEST_PATH || '';

// Se il test è nella cartella integration, esegui setup.ts
if (__filename.includes(path.join('src', 'tests', 'integration', 'e2e'))) {
    require('./setup'); // carica il setup vero per DB, ecc.
}

import path from "path";

// In Jest, ogni file di test viene eseguito con setupFilesAfterEnv PRIMA dei test.
// Per sapere quale test è in esecuzione, usiamo:
//    expect.getState().testPath
//
// MA attenzione: expect.getState() non è disponibile a livello top-level.
// Quindi dobbiamo usare un workaround: salvare il testPath tramite stack trace.

const err = new Error();
const stack = (err.stack || "").split("\n");

// Cerca il path del test che ha richiesto questo file
const testPath = stack
  .map((l) => l.match(/\((.*\.test\.ts):\d+:\d+\)/))
  .filter(Boolean)
  .map((m) => m![1])[0];

if (testPath) {
  if (
    testPath.includes(path.join("src", "tests", "integration")) ||
    testPath.includes(path.join("src", "tests", "e2e"))
  ) {
    require("./setup");
  }
}

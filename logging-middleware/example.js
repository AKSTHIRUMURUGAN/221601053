import Log from "./index.js";

async function testLogger() {
  await Log("backend", "error", "handler", "received string, expected bool");
  await Log("backend", "fatal", "db", "Critical database connection failure.");
}

testLogger();

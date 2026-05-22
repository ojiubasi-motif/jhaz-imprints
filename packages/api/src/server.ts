/**
 * Express server entry point.
 *
 * dotenv is loaded HERE, before everything else, so that process.env
 * is fully populated when catalog-db, db, and app.ts modules initialize.
 *
 * __dirname does not exist in ESM — use fileURLToPath(import.meta.url).
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load packages/api/.env before any other module reads process.env
config({ path: resolve(__dirname, "../.env") });

// Dynamic import ensures the above config() call completes first
const { default: app, initializeDatabases } = await import("./app.js");

const PORT = process.env.PORT || 3000;

// Initialize databases before listening
await initializeDatabases();

app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});

import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env from root project directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "../../");
config({ path: join(rootDir, ".env") });

// Override DATABASE_URL with TEST_DATABASE_URL for tests
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/**/*.test.ts",
        "dist/",
      ],
    },
  },
});

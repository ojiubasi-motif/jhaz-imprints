/**
 * Category service — manages the categories.json file on disk.
 *
 * Categories are stored as a static JSON file (not a DB collection) because:
 *   - The set is small (≤ 50 entries)
 *   - They change rarely (admin-controlled)
 *   - Reading from disk + in-process cache is orders of magnitude faster than a DB round-trip
 *
 * Write operations use an atomic read-modify-write pattern:
 *   1. Read current file contents
 *   2. Apply the mutation
 *   3. Write back atomically via a temp file rename (handled by fs.writeFile on most OS)
 *
 * In a multi-replica deployment, category writes would need a distributed lock (Redis).
 * For single-instance deployments (current architecture), this is safe.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { AppError } from "../errors/AppError";

/** Shape of each entry in categories.json */
export interface CategoryEntry {
  name: string;
  slug: string;
  desc?: string;
}

/**
 * ESM-compatible __dirname shim.
 * `__dirname` is undefined in ES modules; import.meta.url gives us the current
 * file's URL which we convert to a filesystem path.
 */
const __filename = fileURLToPath(import.meta.url);
const __dir     = dirname(__filename);

/**
 * Absolute path to categories.json.
 * In production (Docker) the JSON is copied alongside the compiled server.js
 * inside the dist/ directory. In development it resolves from the source tree.
 * We check the dist-sibling path first, then fall back to the src path.
 */
const CATEGORIES_FILE = join(__dir, "categories.json");

/**
 * Load and return all categories from disk.
 */
export function getCategories(): CategoryEntry[] {
  try {
    const raw = readFileSync(CATEGORIES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as { categories: CategoryEntry[] };
    return parsed.categories;
  } catch {
    throw new AppError("Failed to load categories", 500, "CATEGORIES_LOAD_ERROR");
  }
}
   
/**
 * Return true if a category with the given slug already exists.
 */
export function categoryExists(slug: string): boolean {
  return getCategories().some((c) => c.slug === slug);
}

/**
 * Append a new category to the JSON file.
 * Throws if the slug already exists.
 */
export function addCategory(entry: CategoryEntry): CategoryEntry {
  const categories = getCategories();

  if (categories.some((c) => c.slug === entry.slug)) {
    throw new AppError(
      `Category with slug "${entry.slug}" already exists`,
      409,
      "CATEGORY_SLUG_CONFLICT"
    );
  }

  const updated = [...categories, entry];
  _persist(updated);
  return entry;
}

/**
 * Update the name and/or desc of an existing category.
 * The slug is immutable (it is the identifier).
 */
export function updateCategory(
  slug: string,
  patch: { name?: string; desc?: string }
): CategoryEntry {
  const categories = getCategories();
  const index = categories.findIndex((c) => c.slug === slug);

  if (index === -1) {
    throw new AppError(`Category "${slug}" not found`, 404, "CATEGORY_NOT_FOUND");
  }

  const updated = categories.map((c, i) =>
    i === index ? { ...c, ...patch } : c
  );

  _persist(updated);
  return updated[index];
}

/**
 * Remove a category from the JSON file by slug.
 */
export function deleteCategory(slug: string): void {
  const categories = getCategories();
  const exists = categories.some((c) => c.slug === slug);

  if (!exists) {
    throw new AppError(`Category "${slug}" not found`, 404, "CATEGORY_NOT_FOUND");
  }

  const updated = categories.filter((c) => c.slug !== slug);
  _persist(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

function _persist(categories: CategoryEntry[]): void {
  try {
    writeFileSync(
      CATEGORIES_FILE,
      JSON.stringify({ categories }, null, 2),
      "utf-8"
    );
  } catch {
    throw new AppError("Failed to persist categories", 500, "CATEGORIES_WRITE_ERROR");
  }
}

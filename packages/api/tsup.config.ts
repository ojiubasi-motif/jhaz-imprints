import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  noExternal: ['@jhaz-imprints/shared', '@jhaz-imprints/db', '@jhaz-imprints/catalog-db'],
  external: ['mongoose', 'mongoose-paginate-v2', '@prisma/client'],
});

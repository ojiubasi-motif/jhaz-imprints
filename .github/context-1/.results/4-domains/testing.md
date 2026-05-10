# Testing Domain — Deep Dive

## Overview
Unit testing with Vitest. Comprehensive mocking of all external services (Redis, email, SMS, Cloudinary) via global setup file.

## Vitest Configuration
```typescript
// packages/api/vitest.config.ts
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
});
```

## Global Test Setup — External Service Mocks
```typescript
// packages/api/src/test-setup.ts
vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({ add: vi.fn().mockResolvedValue({ id: "mock-job-id" }), close: vi.fn() })),
  Worker: vi.fn().mockImplementation(() => ({ on: vi.fn(), close: vi.fn() })),
}));
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn(() => ({ sendMail: vi.fn() })) } }));
vi.mock("twilio", () => ({ default: vi.fn(() => ({ messages: { create: vi.fn() } })) }));
vi.mock("cloudinary", () => ({ v2: { config: vi.fn(), uploader: { upload_stream: vi.fn(), destroy: vi.fn() } } }));
```

## Test File Location
Tests live in `__tests__/` directories alongside their source:
- `packages/api/src/services/__tests__/orderService.test.ts`
- `packages/api/src/services/__tests__/pricingEngine.test.ts`

## Test Database
`TEST_DATABASE_URL` overrides `DATABASE_URL` when present. Tests must never hit production.

## Running Tests
```bash
pnpm test                    # Run all tests
pnpm --filter @jhaz-imprints/api test
pnpm --filter @jhaz-imprints/api test:coverage
```

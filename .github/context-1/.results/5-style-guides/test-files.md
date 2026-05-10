# Style Guide: Test Files

## Unique Conventions
- Tests use Vitest (`describe`, `it`, `expect`, `vi`)
- Test files named `{module}.test.ts` inside `__tests__/` subdirectory adjacent to source
- Global mocks for external services set up in `test-setup.ts` (setupFiles config)
- `TEST_DATABASE_URL` env var overrides `DATABASE_URL` for test isolation
- Tests are service-level unit tests (no integration/e2e tests)
- Pure function tests (e.g., `pricingEngine.test.ts`) test edge cases like negative values and floating point

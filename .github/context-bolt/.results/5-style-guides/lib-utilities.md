# Style Guide: `lib-utilities`

## What Makes This Project Unique

### 1. Single Exported Singleton — Never Instantiate Twice
`src/lib/supabase.ts` exports a single `supabase` client instance. No component or module ever calls `createClient()` directly:
```typescript
// ✅ Correct — import the singleton
import { supabase } from '../lib/supabase';

// ❌ Wrong — never do this in a component
import { createClient } from '@supabase/supabase-js';
const client = createClient(...);
```

### 2. Credentials Are Always From `import.meta.env`
The Supabase URL and anon key always come from Vite environment variables — never hardcoded:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```
Both variables must exist in `.env` (which is gitignored) for the app to function.

### 3. `lib/` Is for Infrastructure, Not Business Logic
The `lib/` folder contains only infrastructure adapters (the Supabase client). Domain logic (filtering, formatting) lives in the component files directly. Keep `lib/` minimal.

### 4. No Type-Safe Supabase Schema Generation (Yet)
The codebase casts Supabase responses manually:
```typescript
if (!error && data) {
  setProducts(data as Product[]);
}
```
No Supabase-generated types or `Database` generic type is used. Any future schema types should follow the same `as TypeName` cast pattern for consistency.

### 5. Shared Utility Helpers
`src/lib/utils.ts` contains pure functional helpers for formatting and pricing conversions:
- `formatNaira(amount: number): string` — formats numbers using `en-NG` locale and `NGN` currency token.
- `convertPrice(price: number): number` — converts catalog prices (raw base values) to standard Naira values.
Import these helpers rather than duplicating formatting configurations locally.

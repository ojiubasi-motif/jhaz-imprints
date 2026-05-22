# State Management Domain Analysis - apps/web

## Patterns and Conventions

- **Redux Toolkit**: Centralized state management using slices.
- **Async Thunks**: All asynchronous operations (API calls) are handled via `createAsyncThunk`.
- **Typed Hooks**:
  - `useAppSelector`: For selecting state from the store.
  - `useAppDispatch`: For dispatching actions.
- **Slice Organization**: Each domain has its own slice in `src/store/slices/`.
- **Mandatory State Clearing**: To prevent stale data "leaks" (e.g., seeing Product A's options on Product B's checkout), slices MUST clear current domain objects on `.pending` cases of fetch thunks.
- **State Guarding**: Components consuming Redux state MUST perform sanity checks (e.g., verifying `currentProduct._id === productId` from URL) before rendering to ensure data consistency.

### Measurement Slice

- **Purpose**: Persist and retrieve user measurement profiles used during checkout.
- **Thunks**:
  - `fetchMyMeasurements` → `GET /api/orders/measurements`
  - `createMeasurement` → `POST /api/orders/measurements`
- **State shape**: `{ items: [], isLoading: false, error: null, isCreating: false, createError: null }`
  - Note: There is NO `current` field. Use `items` array and select by `id` in component logic.
  - `isCreating` / `createError` track the `createMeasurement` async state separately from list loading.

Example thunk skeleton:
```ts
export const createMeasurement = createAsyncThunk(
  'measurements/createMeasurement',
  async (payload: MeasurementCreate, { rejectWithValue }) => {
    try {
      // fetchApi auto-unwraps the Quizio envelope — no need for response.data
      const profile = await fetchApi('/orders/measurements', { method: 'POST', body: JSON.stringify(payload) });
      return profile; // { id, profileName, chest, waist, ... }
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
```

### Orders Slice — createOrder Payload Shape
The `createOrder.fulfilled` action receives this shape from the backend:
```typescript
{
  orderId: string;        // UUID of the created order
  totalAmount: number;    // Total in Naira (NOT kobo)
  status: string;         // "PENDING" or "PENDING_PAYMENT"
  reference: string;      // Paystack payment reference
  paystackAccessCode: string;  // Use with PaystackPop.setup({ access_code })
  paymentUrl?: string;    // Optional redirect URL
  measurement?: object;   // Snapshot of measurements used
}
```
Stored in `state.orders.currentOrder` and prepended to `state.orders.items`.


## Code Examples

### Async Thunk Pattern (`src/store/slices/authSlice.ts`)
```typescript
export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as { user: User };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Slice Configuration
```typescript
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      });
  },
});
```

### Using State in Components
```tsx
import { useAppSelector, useAppDispatch } from "@/store/hooks";

const { user } = useAppSelector((state) => state.auth);
const dispatch = useAppDispatch();
```

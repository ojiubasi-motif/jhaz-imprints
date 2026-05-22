# Redux Slices Style Guide - apps/web

## Core Principles

- **Slice Location**: All slices must reside in `src/store/slices/`.
- **Async Logic**: Always use `createAsyncThunk` for API interactions.
- **Initial State**: Define a clear interface for the slice state.
- **Error Handling**: Maintain an `error` string in the state for UI feedback.

## Implementation Patterns

### Async Thunk Convention
Thunks should be defined outside the slice and follow the `domain/action` naming pattern.

```typescript
export const fetchData = createAsyncThunk(
  'domain/fetchData',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/endpoint');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Extra Reducers
Use the builder callback pattern in `extraReducers` to handle thunk lifecycle (pending, fulfilled, rejected).

```typescript
extraReducers: (builder) => {
  builder
    .addCase(fetchData.pending, (state) => {
      state.isLoading = true;
    })
    .addCase(fetchData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    })
    .addCase(fetchData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
}
```

## Naming Conventions
- Files should be `camelCaseSlice.ts`.
- Slices should be named after the domain (e.g., `auth`, `products`).

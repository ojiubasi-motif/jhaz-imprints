# Redux Store Style Guide - apps/web

## Core Principles
- Single store in `src/store/index.ts`.
- Uses `configureStore` from Redux Toolkit.
- Exports `RootState` and `AppDispatch` types.
- All reducers must be combined in the main store.

# Redux Hooks Style Guide - apps/web

## Core Principles
- Typed wrappers for `useSelector` and `useDispatch`.
- Located in `src/store/hooks.ts`.
- Components should always use `useAppDispatch` and `useAppSelector` instead of the standard ones.

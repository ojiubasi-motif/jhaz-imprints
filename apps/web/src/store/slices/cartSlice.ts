import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OrderCreate } from '@jhaz-imprints/shared';

const STORAGE_KEY = 'measurement_wizard_draft';

interface CartState {
  draft: Partial<OrderCreate>;
}

const getInitialDraft = (): Partial<OrderCreate> => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
  }
  return {};
};

const initialState: CartState = {
  draft: getInitialDraft(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    updateDraft: (state, action: PayloadAction<Partial<OrderCreate>>) => {
      state.draft = { ...state.draft, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.draft));
      }
    },
    clearDraft: (state) => {
      state.draft = {};
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});

export const { updateDraft, clearDraft } = cartSlice.actions;
export default cartSlice.reducer;

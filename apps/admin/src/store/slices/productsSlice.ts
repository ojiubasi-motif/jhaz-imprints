import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchApi } from '@/lib/api';

interface ProductsState {
  items: any[];
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  saveError: string | null;
}

const initialState: ProductsState = {
  items: [],
  isLoading: false,
  error: null,
  isSaving: false,
  saveError: null,
};

export const fetchAdminProducts = createAsyncThunk(
  'products/fetchAdminProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/v1/admin/products');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAdminProduct = createAsyncThunk(
  'products/createAdminProduct',
  async (productData: any, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/v1/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      return response.product;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAdminProduct = createAsyncThunk(
  'products/updateAdminProduct',
  async ({ id, data }: { id: string, data: any }, { rejectWithValue }) => {
    try {
      const response = await fetchApi(`/v1/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.product;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSaveError: (state) => {
      state.saveError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAdminProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createAdminProduct.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(createAdminProduct.fulfilled, (state, action) => {
        state.isSaving = false;
        if (action.payload) state.items.push(action.payload);
      })
      .addCase(createAdminProduct.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
      })
      // Update
      .addCase(updateAdminProduct.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        state.isSaving = false;
        if (action.payload) {
          const index = state.items.findIndex(p => (p.id || p._id) === (action.payload.id || action.payload._id));
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      })
      .addCase(updateAdminProduct.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
      });
  },
});

export const { clearSaveError } = productsSlice.actions;
export default productsSlice.reducer;

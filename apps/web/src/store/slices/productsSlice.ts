import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchApi } from '@/lib/api';
import type { IProduct } from '@jhaz-imprints/catalog-db';

interface ProductsState {
  items: IProduct[];
  currentProduct: IProduct | null;
  isLoading: boolean;
  error: string | null;
  totalDocs: number;
  totalPages: number;
  page: number;
}

const initialState: ProductsState = {
  items: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  totalDocs: 0,
  totalPages: 0,
  page: 1,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, category = '' }: { page?: number; category?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (page) query.append('page', page.toString());
      if (category) query.append('category', category);
      
      const response = await fetchApi(`/products?${query.toString()}`);
      return response; // Assumes paginated response { docs, totalDocs, totalPages, page }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetchApi(`/products/${id}`);
      return response as IProduct;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        // Check if response is paginated (Mongoose paginate v2 structure)
        if (action.payload && action.payload.docs) {
          state.items = action.payload.docs;
          state.totalDocs = action.payload.totalDocs;
          state.totalPages = action.payload.totalPages;
          state.page = action.payload.page;
        } else {
          // Fallback if it's just an array
          state.items = Array.isArray(action.payload) ? action.payload : [];
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Product
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;

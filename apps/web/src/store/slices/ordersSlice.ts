import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchApi } from '@/lib/api';
import type { OrderCreate } from '@jhaz-imprints/shared';

interface OrdersState {
  items: any[];
  currentOrder: any | null;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  createError: string | null;
}

const initialState: OrdersState = {
  items: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  isCreating: false,
  createError: null,
};

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/orders/my-orders');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetchApi(`/orders/${id}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: OrderCreate, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCreateError: (state) => {
      state.createError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Order by Id
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false;
        // Optionally add it to items
        if (action.payload && action.payload.order) {
          state.items.unshift(action.payload.order);
          state.currentOrder = action.payload.order;
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      });
  },
});

export const { clearCreateError } = ordersSlice.actions;
export default ordersSlice.reducer;

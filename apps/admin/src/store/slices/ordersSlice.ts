import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchApi } from '@/lib/api';

interface OrdersState {
  items: any[];
  isLoading: boolean;
  error: string | null;
  statusFilter: string;
}

const initialState: OrdersState = {
  items: [],
  isLoading: false,
  error: null,
  statusFilter: 'ALL',
};

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/v1/admin/orders'); // Replace with correct admin orders route
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }: { id: string, status: string }, { rejectWithValue }) => {
    try {
      const response = await fetchApi(`/v1/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return response.order;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(o => o.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      });
  },
});

export const { setStatusFilter } = ordersSlice.actions;
export default ordersSlice.reducer;

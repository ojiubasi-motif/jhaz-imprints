import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchApi } from '@/lib/api';

interface AnalyticsState {
  data: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  isLoading: false,
  error: null,
};

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/v1/admin/analytics');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default analyticsSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchApi } from '@/lib/api';
import type { MeasurementCreate } from '@jhaz-imprints/shared';

interface MeasurementsState {
  items: any[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  createError: string | null;
}

const initialState: MeasurementsState = {
  items: [],
  isLoading: false,
  error: null,
  isCreating: false,
  createError: null,
};

export const fetchMyMeasurements = createAsyncThunk(
  'measurements/fetchMyMeasurements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/orders/measurements'); // Adjust route if needed, checking standard setup
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createMeasurement = createAsyncThunk(
  'measurements/createMeasurement',
  async (measurementData: MeasurementCreate, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/orders/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const measurementsSlice = createSlice({
  name: 'measurements',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Measurements
      .addCase(fetchMyMeasurements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyMeasurements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyMeasurements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Measurement
      .addCase(createMeasurement.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createMeasurement.fulfilled, (state, action) => {
        state.isCreating = false;
        state.items.push(action.payload);
      })
      .addCase(createMeasurement.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      });
  },
});

export default measurementsSlice.reducer;

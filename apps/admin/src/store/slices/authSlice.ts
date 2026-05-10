import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { LoginData } from '@jhaz-imprints/shared';
import { fetchApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'TAILOR';
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null,
  isLoading: false,
  error: null,
};

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.user.role === 'CUSTOMER') {
        throw new Error('Unauthorized role for admin dashboard.');
      }
      return response as { user: User; token: string };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadProfile = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/profile');
      return response.user as User;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', action.payload.token);
          localStorage.setItem('admin_role', action.payload.user.role);
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load Profile
      .addCase(loadProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loadProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.token = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_role');
        }
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { LoginData, RegisterData } from '@jhaz-imprints/shared';
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
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      // Cookie is set by backend; we only need the user data
      return response as { user: User };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      // Cookie is set by backend; we only need the user data
      return response as { user: User };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadProfile = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/profile'); // Assuming profile route exists, if not we'll handle token without user data
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
      // Cookie cleared by backend on logout endpoint
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        // Cookie set by backend via Set-Cookie header
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        // Cookie set by backend via Set-Cookie header
      })
      .addCase(registerUser.rejected, (state, action) => {
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
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;

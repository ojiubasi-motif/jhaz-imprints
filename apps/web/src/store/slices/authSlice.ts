import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { LoginData, RegisterData } from '@jhaz-imprints/shared';
import { fetchApi } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';

interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'TAILOR';
  firstName?: string;
  lastName?: string;
  full_name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  expiresAt: number | null; // Token expiry time (ms since epoch)
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
  expiresAt: null,
};

/**
 * Login user and store the access token in memory.
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const { access_token, user } = response;

      // Store access token in memory (not localStorage)
      tokenStore.setToken(access_token);

      return {
        user,
        expiresAt: tokenStore.getExpiryTime(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Register user and store the access token in memory.
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const { access_token, user } = response;

      // Store access token in memory (not localStorage)
      tokenStore.setToken(access_token);

      return {
        user,
        expiresAt: tokenStore.getExpiryTime(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Load profile (silent restore) using the refresh token from the cookie.
 * If the refresh token is valid, the server will give us a new access token.
 */
export const loadProfile = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      // The apiClient will auto-refresh if needed before this request
      const response = await fetchApi('/auth/me');
      const user = response.user;

      // If we got here, the token in tokenStore is valid
      return {
        user,
        expiresAt: tokenStore.getExpiryTime(),
      };
    } catch (error: any) {
      // No valid session
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Logout: clear local state and token store.
 * Backend will clear the httpOnly cookie when we call /auth/logout.
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
      tokenStore.clear();
      return null;
    } catch (error: any) {
      // Even if the request fails, clear the local token
      tokenStore.clear();
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clear error message.
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Manually set the user and expiry (for testing or emergency recovery).
     */
    setUser: (state, action: PayloadAction<{ user: User; expiresAt: number | null }>) => {
      state.user = action.payload.user;
      state.expiresAt = action.payload.expiresAt;
    },

    /**
     * Clear auth state without calling logout endpoint.
     * Used when auth-expired event is received.
     */
    clearAuth: (state) => {
      state.user = null;
      state.expiresAt = null;
      state.error = null;
      tokenStore.clear();
    },
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
        state.expiresAt = action.payload.expiresAt;
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
        state.expiresAt = action.payload.expiresAt;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Load Profile (silent restore)
      .addCase(loadProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.expiresAt = action.payload.expiresAt;
      })
      .addCase(loadProfile.rejected, (state) => {
        state.isLoading = false;
        // No user data; will redirect to login in Providers
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.expiresAt = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Still clear state even if logout request fails
        state.user = null;
        state.expiresAt = null;
      });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
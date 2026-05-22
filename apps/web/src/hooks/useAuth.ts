import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, registerUser, logoutUser, clearError } from '@/store/slices/authSlice';
import { tokenStore } from '@/lib/tokenStore';

/**
 * Hook to access auth state and actions from components.
 * 
 * Usage:
 *   const { user, isLoading, error, login, register, logout } = useAuth();
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isLoading, error, expiresAt } = useAppSelector(
    (state) => state.auth
  );

  return {
    user,
    isLoading,
    error,
    expiresAt,
    isAuthenticated: !!user,
    hasToken: tokenStore.hasToken(),
    timeUntilExpiry: tokenStore.getTimeUntilExpiry(),

    async login(email: string, password: string) {
      return dispatch(loginUser({ email, password }));
    },

    async register(
      email: string,
      password: string,
      firstName: string = '',
      lastName: string = ''
    ) {
      return dispatch(registerUser({ email, password, firstName, lastName }));
    },

    async logout() {
      return dispatch(logoutUser());
    },

    clearError() {
      dispatch(clearError());
    },
  };
}

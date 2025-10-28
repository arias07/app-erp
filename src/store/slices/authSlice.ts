
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Usuario } from '../../types/user.types';

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true, // Empieza en true para mostrar el loader inicial
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Usuario | null>) => {
      console.log('Redux: setUser called with:', action.payload?.email || 'null');
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      console.log('Redux: setLoading called with:', action.payload);
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      console.log('Redux: setError called with:', action.payload);
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      console.log('Redux: logout called');
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearError, logout } = authSlice.actions;
export default authSlice.reducer;

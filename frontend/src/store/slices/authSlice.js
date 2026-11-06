import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/apiClient';

// Async Thunk: Login User
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.login({ email, password });
      const { access_token, user } = response.data;
      localStorage.setItem('placyra_token', access_token);
      localStorage.setItem('placyra_user', JSON.stringify(user));
      return { access_token, user };
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid email or password';
      return rejectWithValue(message);
    }
  }
);

// Async Thunk: Register User
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      const { access_token, user } = response.data;
      localStorage.setItem('placyra_token', access_token);
      localStorage.setItem('placyra_user', JSON.stringify(user));
      return { access_token, user };
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Async Thunk: Fetch Current User Profile
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getMe();
      localStorage.setItem('placyra_user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      localStorage.removeItem('placyra_token');
      localStorage.removeItem('placyra_user');
      return rejectWithValue('Session expired or invalid credentials');
    }
  }
);

const storedToken = localStorage.getItem('placyra_token');
let storedUser = null;
try {
  const raw = localStorage.getItem('placyra_user');
  if (raw) storedUser = JSON.parse(raw);
} catch (e) {
  storedUser = null;
}

const initialState = {
  user: storedUser,
  token: storedToken || null,
  isAuthenticated: !!storedToken && !!storedUser,
  loading: !!storedToken, // initial verification if token exists
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('placyra_token');
      localStorage.removeItem('placyra_user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

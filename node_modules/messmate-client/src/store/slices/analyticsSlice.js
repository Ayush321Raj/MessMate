import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchOverview = createAsyncThunk('analytics/overview', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/overview');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch overview');
  }
});

export const fetchAttendanceAnalytics = createAsyncThunk('analytics/attendance', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/attendance', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch attendance analytics');
  }
});

export const fetchWastageAnalytics = createAsyncThunk('analytics/wastage', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/wastage');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch wastage analytics');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    overview: null,
    attendance: null,
    wastage: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => { state.loading = true; })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAttendanceAnalytics.fulfilled, (state, action) => {
        state.attendance = action.payload;
      })
      .addCase(fetchWastageAnalytics.fulfilled, (state, action) => {
        state.wastage = action.payload;
      });
  },
});

export default analyticsSlice.reducer;

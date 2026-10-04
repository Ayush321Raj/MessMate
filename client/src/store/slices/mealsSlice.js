import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchMeals = createAsyncThunk('meals/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/meals', { params });
    return data.meals;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch meals');
  }
});

export const optInMeal = createAsyncThunk('meals/optIn', async (mealId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/meals/${mealId}/optin`);
    return { mealId, optin: data.optin };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Opt-in failed');
  }
});

export const optOutMeal = createAsyncThunk('meals/optOut', async (mealId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/meals/${mealId}/optout`);
    return { mealId, optin: data.optin };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Opt-out failed');
  }
});

export const createMeal = createAsyncThunk('meals/create', async (mealData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/meals', mealData);
    return data.meal;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create meal');
  }
});

const mealsSlice = createSlice({
  name: 'meals',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    clearMealsError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMeals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(optInMeal.fulfilled, (state, action) => {
        const meal = state.items.find((m) => m._id === action.payload.mealId);
        if (meal) meal.optin = action.payload.optin;
      })
      .addCase(optOutMeal.fulfilled, (state, action) => {
        const meal = state.items.find((m) => m._id === action.payload.mealId);
        if (meal) meal.optin = action.payload.optin;
      })
      .addCase(createMeal.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const { clearMealsError } = mealsSlice.actions;
export default mealsSlice.reducer;

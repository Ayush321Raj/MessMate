import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchInventory = createAsyncThunk('inventory/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/inventory');
    return data.inventory;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch inventory');
  }
});

export const updateInventoryItem = createAsyncThunk('inventory/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/inventory/${id}`, updates);
    return data.item;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const createInventoryItem = createAsyncThunk('inventory/create', async (item, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/inventory', item);
    return data.item;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Create failed');
  }
});

export const restockItem = createAsyncThunk('inventory/restock', async ({ id, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/inventory/${id}/restock`, { quantity });
    return data.item;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Restock failed');
  }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(restockItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default inventorySlice.reducer;

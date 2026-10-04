import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import mealsReducer from './slices/mealsSlice';
import inventoryReducer from './slices/inventorySlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meals: mealsReducer,
    inventory: inventoryReducer,
    analytics: analyticsReducer,
  },
});

import { configureStore } from '@reduxjs/toolkit'
import workflowsSlice from './features/workflowsSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
        workflows: workflowsSlice
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
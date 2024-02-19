import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { WorkflowTemplateId } from '../types'
import { RootState } from '../store'

export interface WorkflowsState {
  selectedTemplateId: WorkflowTemplateId
}

const initialState: WorkflowsState = {
    selectedTemplateId: "empty",
}

export const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    setSelectedTemplateId: (state, action: PayloadAction<WorkflowTemplateId>) => {
      state.selectedTemplateId = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedTemplateId } = workflowsSlice.actions

export const getSelectedTemplateId = (state: RootState) => state.workflows.selectedTemplateId;

export default workflowsSlice.reducer


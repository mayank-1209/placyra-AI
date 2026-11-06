import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentApi, analyticsApi } from '../../services/apiClient';

// Async Thunk: Upload & Parse Resume with OCR
export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await studentApi.uploadResume(formData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to process resume OCR';
      return rejectWithValue(message);
    }
  }
);

// Async Thunk: Fetch Current Student Resume Profile
export const fetchMyResume = createAsyncThunk(
  'resume/fetchMyResume',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getMyResume();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch resume');
    }
  }
);

// Async Thunk: Compute Skill Gap against Company
export const analyzeSkillGap = createAsyncThunk(
  'resume/analyzeSkillGap',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await studentApi.analyzeGap(companyId);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to compute skill gap analysis';
      return rejectWithValue(message);
    }
  }
);

// Async Thunk: Fetch Student Placement Readiness
export const fetchStudentReadiness = createAsyncThunk(
  'resume/fetchStudentReadiness',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getStudentReadiness();
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load readiness analytics';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  currentResume: null,
  skillGapAnalysis: null,
  readiness: null,
  uploadLoading: false,
  analysisLoading: false,
  readinessLoading: false,
  uploadSuccess: false,
  error: null,
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    clearResumeError: (state) => {
      state.error = null;
    },
    resetUploadStatus: (state) => {
      state.uploadSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Upload Resume
    builder
      .addCase(uploadResume.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
        state.uploadSuccess = false;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.currentResume = action.payload;
        state.uploadSuccess = true;
        state.error = null;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
        state.uploadSuccess = false;
      });

    // Fetch Resume
    builder
      .addCase(fetchMyResume.fulfilled, (state, action) => {
        state.currentResume = action.payload;
      });

    // Analyze Skill Gap
    builder
      .addCase(analyzeSkillGap.pending, (state) => {
        state.analysisLoading = true;
        state.error = null;
      })
      .addCase(analyzeSkillGap.fulfilled, (state, action) => {
        state.analysisLoading = false;
        state.skillGapAnalysis = action.payload;
        state.error = null;
      })
      .addCase(analyzeSkillGap.rejected, (state, action) => {
        state.analysisLoading = false;
        state.error = action.payload;
      });

    // Fetch Readiness
    builder
      .addCase(fetchStudentReadiness.pending, (state) => {
        state.readinessLoading = true;
      })
      .addCase(fetchStudentReadiness.fulfilled, (state, action) => {
        state.readinessLoading = false;
        state.readiness = action.payload;
      })
      .addCase(fetchStudentReadiness.rejected, (state, action) => {
        state.readinessLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearResumeError, resetUploadStatus } = resumeSlice.actions;
export default resumeSlice.reducer;

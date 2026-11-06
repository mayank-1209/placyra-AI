import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tnpApi, analyticsApi } from '../../services/apiClient';

// Companies
export const fetchCompanies = createAsyncThunk(
  'tnp/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const resp = await tnpApi.getCompanies();
      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch companies');
    }
  }
);

export const createCompany = createAsyncThunk(
  'tnp/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const resp = await tnpApi.createCompany(companyData);
      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create company profile');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'tnp/deleteCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      await tnpApi.deleteCompany(companyId);
      return companyId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete company');
    }
  }
);

// Questions
export const createQuestion = createAsyncThunk(
  'tnp/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      const resp = await tnpApi.createQuestion(questionData);
      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to submit question');
    }
  }
);

export const bulkUploadQuestions = createAsyncThunk(
  'tnp/bulkUploadQuestions',
  async (formData, { rejectWithValue }) => {
    try {
      const resp = await tnpApi.bulkUploadQuestions(formData);
      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to process bulk upload');
    }
  }
);

export const fetchPendingQuestions = createAsyncThunk(
  'tnp/fetchPendingQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const resp = await tnpApi.getPendingQuestions();
      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch pending questions');
    }
  }
);

export const approveQuestion = createAsyncThunk(
  'tnp/approveQuestion',
  async (questionId, { rejectWithValue }) => {
    try {
      const resp = await tnpApi.approveQuestion(questionId);
      return { id: questionId, data: resp.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to approve question');
    }
  }
);

export const rejectQuestion = createAsyncThunk(
  'tnp/rejectQuestion',
  async (questionId, { rejectWithValue }) => {
    try {
      await tnpApi.rejectQuestion(questionId);
      return questionId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to reject question');
    }
  }
);

export const fetchBatchAnalytics = createAsyncThunk(
  'tnp/fetchBatchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const resp = await analyticsApi.getTnpBatchOverview();
      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load batch analytics');
    }
  }
);

const initialState = {
  companies: [],
  pendingQuestions: [],
  bulkUploadResult: null,
  batchAnalytics: null,
  loading: false,
  actionLoadingId: null,
  error: null,
  successMessage: null,
};

const tnpSlice = createSlice({
  name: 'tnp',
  initialState,
  reducers: {
    clearTnpMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Companies
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.push(action.payload);
        state.successMessage = `Company ${action.payload.name} created successfully.`;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter((c) => c.id !== action.payload);
      });

    // Single Question
    builder
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Question submitted and indexed successfully!';
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Bulk Upload
    builder
      .addCase(bulkUploadQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.bulkUploadResult = null;
      })
      .addCase(bulkUploadQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.bulkUploadResult = action.payload;
      })
      .addCase(bulkUploadQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Moderation Queue
    builder
      .addCase(fetchPendingQuestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingQuestions = action.payload;
      })
      .addCase(fetchPendingQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveQuestion.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
      })
      .addCase(approveQuestion.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.pendingQuestions = state.pendingQuestions.filter((q) => q.id !== action.payload.id);
        state.successMessage = `Question #${action.payload.id} approved and indexed into Qdrant!`;
      })
      .addCase(approveQuestion.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload;
      })
      .addCase(rejectQuestion.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
      })
      .addCase(rejectQuestion.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.pendingQuestions = state.pendingQuestions.filter((q) => q.id !== action.payload);
      })
      .addCase(rejectQuestion.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload;
      });

    // Batch Analytics
    builder
      .addCase(fetchBatchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBatchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.batchAnalytics = action.payload;
      })
      .addCase(fetchBatchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTnpMessages } = tnpSlice.actions;
export default tnpSlice.reducer;

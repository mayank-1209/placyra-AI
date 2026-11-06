import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { interviewApi } from '../../services/apiClient';

// Async Thunk: Start Mock Interview Session
export const startMockInterview = createAsyncThunk(
  'interview/startMockInterview',
  async ({ companyId, targetRole, difficulty }, { rejectWithValue }) => {
    try {
      const response = await interviewApi.startInterview({
        company_id: companyId ? parseInt(companyId) : null,
        target_role: targetRole,
        difficulty: difficulty,
      });
      return {
        ...response.data,
        targetRole,
        difficulty,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to initialize mock interview');
    }
  }
);

// Async Thunk: Submit Candidate Answer
export const submitInterviewAnswer = createAsyncThunk(
  'interview/submitInterviewAnswer',
  async ({ sessionId, answerText }, { rejectWithValue }) => {
    try {
      const response = await interviewApi.submitAnswer(sessionId, answerText);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to submit answer');
    }
  }
);

// Async Thunk: End Interview Session
export const endMockInterview = createAsyncThunk(
  'interview/endMockInterview',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await interviewApi.endInterview(sessionId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to conclude interview');
    }
  }
);

// Async Thunk: Fetch Past Sessions
export const fetchInterviewHistory = createAsyncThunk(
  'interview/fetchInterviewHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await interviewApi.getHistory();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load interview history');
    }
  }
);

const initialState = {
  session: null,
  messages: [],
  currentTurn: 1,
  concludedReport: null,
  history: [],
  loading: false,
  evaluating: false,
  error: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    resetInterviewSession: (state) => {
      state.session = null;
      state.messages = [];
      state.currentTurn = 1;
      state.concludedReport = null;
      state.loading = false;
      state.evaluating = false;
      state.error = null;
    },
    appendOptimisticUserMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // Start Interview
    builder
      .addCase(startMockInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.concludedReport = null;
        state.messages = [];
      })
      .addCase(startMockInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.session = {
          id: action.payload.session_id,
          target_role: action.payload.targetRole,
          difficulty: action.payload.difficulty,
        };
        state.currentTurn = action.payload.turn_number;
        state.messages = [
          {
            id: `turn-${action.payload.turn_number}-q`,
            role: 'assistant',
            turn_number: action.payload.turn_number,
            text: action.payload.question,
            topic: action.payload.context_topic,
            hints: action.payload.hints,
          },
        ];
      })
      .addCase(startMockInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Submit Answer
    builder
      .addCase(submitInterviewAnswer.pending, (state) => {
        state.evaluating = true;
        state.error = null;
      })
      .addCase(submitInterviewAnswer.fulfilled, (state, action) => {
        state.evaluating = false;
        const data = action.payload;

        // Update the last user message with score & feedback
        for (let i = state.messages.length - 1; i >= 0; i--) {
          if (state.messages[i].role === 'user') {
            state.messages[i].score = data.evaluation_score;
            state.messages[i].feedback = data.evaluation_feedback;
            break;
          }
        }

        if (data.is_concluded) {
          state.currentTurn = data.turn_number;
        } else {
          // Append Next Question
          state.currentTurn = data.turn_number;
          state.messages.push({
            id: `turn-${data.turn_number}-q`,
            role: 'assistant',
            turn_number: data.turn_number,
            text: data.question,
            topic: data.context_topic,
            hints: data.hints,
          });
        }
      })
      .addCase(submitInterviewAnswer.rejected, (state, action) => {
        state.evaluating = false;
        state.error = action.payload;
      });

    // End Interview
    builder
      .addCase(endMockInterview.pending, (state) => {
        state.loading = true;
      })
      .addCase(endMockInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.concludedReport = action.payload;
      })
      .addCase(endMockInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // History
    builder
      .addCase(fetchInterviewHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { resetInterviewSession, appendOptimisticUserMessage } = interviewSlice.actions;
export default interviewSlice.reducer;

// In-memory action registry to resume function callbacks after successful authentication
const pendingCallbacks = new Map();

let nextCallbackId = 1;

export const registerPendingCallback = (fn, metadata = {}) => {
  const id = `action_${nextCallbackId++}_${Date.now()}`;
  pendingCallbacks.set(id, { fn, metadata });
  return id;
};

export const executePendingCallback = (id) => {
  if (!id) return;
  const entry = pendingCallbacks.get(id);
  if (entry && typeof entry.fn === 'function') {
    try {
      entry.fn(entry.metadata);
    } catch (err) {
      console.error('Error executing pending action callback:', err);
    }
  }
  pendingCallbacks.delete(id);
};

export const clearPendingCallbacks = () => {
  pendingCallbacks.clear();
};

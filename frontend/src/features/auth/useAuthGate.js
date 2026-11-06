import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openAuthModal, clearPendingAction } from '../../store/slices/authSlice';
import { registerPendingCallback, executePendingCallback } from './pendingActionRegistry';

export const useAuthGate = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, pendingAction } = useSelector((state) => state.auth);
  const prevAuthRef = useRef(isAuthenticated);

  // Resume pending action automatically on login/signup transition
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated && pendingAction) {
      if (pendingAction.callbackId) {
        executePendingCallback(pendingAction.callbackId);
      }
      dispatch(clearPendingAction());
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, pendingAction, dispatch]);

  const requireAuth = useCallback(
    (callback, actionMetadata = {}) => {
      if (isAuthenticated) {
        if (typeof callback === 'function') {
          callback();
        }
        return true;
      }

      // Guest mode: register callback and open auth modal
      let callbackId = null;
      if (typeof callback === 'function') {
        callbackId = registerPendingCallback(callback, actionMetadata);
      }

      dispatch(
        openAuthModal({
          mode: actionMetadata.mode || 'signup',
          pendingAction: {
            ...actionMetadata,
            callbackId,
            timestamp: Date.now(),
          },
        })
      );
      return false;
    },
    [isAuthenticated, dispatch]
  );

  return {
    isAuthenticated,
    requireAuth,
  };
};

export default useAuthGate;

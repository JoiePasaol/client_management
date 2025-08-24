import { useState } from 'react';

interface ConfirmDialogState<T = any> {
  isOpen: boolean;
  data: T | null;
  isLoading: boolean;
}

export function useConfirmDialog<T = any>() {
  const [state, setState] = useState<ConfirmDialogState<T>>({
    isOpen: false,
    data: null,
    isLoading: false,
  });

  const openDialog = (data: T) => {
    setState({
      isOpen: true,
      data,
      isLoading: false,
    });
  };

  const closeDialog = () => {
    if (!state.isLoading) {
      setState({
        isOpen: false,
        data: null,
        isLoading: false,
      });
    }
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  return {
    ...state,
    openDialog,
    closeDialog,
    setLoading,
  };
}
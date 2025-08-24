import { useState } from 'react';

interface ModalState<T = any> {
  isOpen: boolean;
  data: T | null;
}

export function useModal<T = any>() {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: false,
    data: null,
  });

  const openModal = (data?: T) => {
    setState({
      isOpen: true,
      data: data || null,
    });
  };

  const closeModal = () => {
    setState({
      isOpen: false,
      data: null,
    });
  };

  return {
    ...state,
    openModal,
    closeModal,
  };
}
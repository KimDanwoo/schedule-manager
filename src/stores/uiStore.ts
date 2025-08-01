// zustand store for ui

import { create } from 'zustand';

interface UiActionState {
  openModal: (modalSetter: (value: boolean) => void) => void;
  closeModal: (modalSetter: (value: boolean) => void, resetFunction?: () => void) => void;
}

interface UiStore extends UiActionState {}

export const useUiStore = create<UiStore>(() => ({
  openModal: (modalSetter) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    modalSetter(true);
  },
  closeModal: (modalSetter, resetFunction) => {
    modalSetter(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
    }
    if (resetFunction) resetFunction();
  },
}));

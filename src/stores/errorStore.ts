// zustand store for error

import { create } from 'zustand';

interface ErrorModalState {
  error: string;
}

interface ErrorActionState {
  setError: (error: string) => void;
}

interface ErrorStore extends ErrorModalState, ErrorActionState {}

export const useErrorStore = create<ErrorStore>((set) => ({
  error: '',

  setError: (error) => set({ error }),
}));

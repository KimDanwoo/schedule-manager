// zustand store for validation

import type { ValidationErrors } from '@/types';
import { create } from 'zustand';

interface ValidationModalState {
  validationErrors: ValidationErrors;
}

interface ValidationActionState {
  setValidationErrors: (validationErrors: ValidationErrors) => void;
}

interface ValidationStore extends ValidationModalState, ValidationActionState {}

export const useValidationStore = create<ValidationStore>((set) => ({
  validationErrors: {},

  setValidationErrors: (validationErrors) => set({ validationErrors }),
}));

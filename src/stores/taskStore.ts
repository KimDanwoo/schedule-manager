// Zustand Store

import type { Task } from '@/types';
import { create } from 'zustand';

interface TaskModalState {
  tasks: Task[];
  newTask: Task;
  showAddTask: boolean;
  showDayModal: boolean;
  selectedDayTasks: Task[];
  editingTask: Task | null;
}

interface TaskActionState {
  addTask: (task: Task) => void;
  setTasks: (tasks: Task[]) => void;
  setNewTask: (task: Task) => void;
  setShowAddTask: (show: boolean) => void;
  setShowDayModal: (show: boolean) => void;
  setSelectedDayTasks: (tasks: Task[]) => void;
  setEditingTask: (task: Task | null) => void;
}

interface TaskStore extends TaskModalState, TaskActionState {}

const initialTasks: Task[] = [
  {
    id: 1,
    title: '프로젝트 기획 회의',
    description: '새로운 웹 프로젝트 기획안 논의',
    category: '업무',
    priority: '높음',
    status: '진행중',
    startDate: '2025-08-01',
    endDate: '2025-08-01',
    startTime: '09:00',
    endTime: '11:00',
    estimatedHours: 2,
    actualHours: 1.5,
  },
];

const initialNewTask: Task = {
  id: 0,
  title: '',
  description: '',
  category: '업무',
  priority: '중간',
  status: '대기',
  startDate: '',
  endDate: '',
  startTime: '09:00',
  endTime: '10:00',
  estimatedHours: 1,
  actualHours: 0,
};

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: initialTasks,
  newTask: initialNewTask,
  showAddTask: false,
  showDayModal: false,
  selectedDayTasks: [],
  editingTask: null,

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  setTasks: (tasks: Task[]) => set({ tasks }),
  setNewTask: (task) => set({ newTask: task }),
  setShowAddTask: (show) => set({ showAddTask: show }),
  setShowDayModal: (show) => set({ showDayModal: show }),
  setSelectedDayTasks: (tasks) => set({ selectedDayTasks: tasks }),
  setEditingTask: (task) => set({ editingTask: task }),
}));

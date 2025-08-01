import { useFilterStore } from '@/stores';
import type { Task } from '@/types';
import { isSameDate } from '@/utils';
import { useCallback } from 'react';

export const useFilteredTask = () => {
  const timeFilter = useFilterStore((state) => state.timeFilter);
  const selectedDate = useFilterStore((state) => state.selectedDate);

  const getFilteredTasksByTime = useCallback(
    ({ tasks }: { tasks: Task[] }): Task[] => {
      try {
        switch (timeFilter) {
          case 'day':
            const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            return tasks.filter((task) => {
              const taskDate = new Date(task.startDate);
              return isSameDate(taskDate, selectedDay);
            });

          case 'month':
            return tasks.filter((task) => {
              const taskDate = new Date(task.startDate);
              return (
                taskDate.getFullYear() === selectedDate.getFullYear() && taskDate.getMonth() === selectedDate.getMonth()
              );
            });

          case 'year':
            return tasks.filter((task) => {
              const taskDate = new Date(task.startDate);
              return taskDate.getFullYear() === selectedDate.getFullYear();
            });

          default:
            return tasks;
        }
      } catch (error) {
        console.error('시간 필터링 오류:', error);
        return tasks;
      }
    },
    [timeFilter, selectedDate],
  );
  return {
    getFilteredTasksByTime,
  };
};

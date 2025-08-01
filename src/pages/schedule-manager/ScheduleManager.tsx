import { useFilteredTask } from '@/hooks/useFilteredTask';
import { useErrorStore, useFilterStore, useTaskStore, useUiStore, useValidationStore } from '@/stores';
import type { Task } from '@/types/index';
import { Badge, Button } from '@components/atoms';
import { Card } from '@components/molecules';
import { CATEGORY_COLORS } from '@constants/index';
import { CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { useCallback, useMemo, type FC } from 'react';

export const ScheduleManager: FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setNewTask = useTaskStore((state) => state.setNewTask);
  const setShowAddTask = useTaskStore((state) => state.setShowAddTask);
  const setEditingTask = useTaskStore((state) => state.setEditingTask);
  const openModal = useUiStore((state) => state.openModal);

  const timeFilter = useFilterStore((state) => state.timeFilter);
  const selectedDate = useFilterStore((state) => state.selectedDate);
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const filterCategory = useFilterStore((state) => state.filterCategory);

  const setError = useErrorStore((state) => state.setError);
  const setValidationErrors = useValidationStore((state) => state.setValidationErrors);

  const { getFilteredTasksByTime } = useFilteredTask();

  // 검색 및 카테고리 필터링된 태스크
  const filteredTasks = useMemo((): Task[] => {
    try {
      const timeFiltered = getFilteredTasksByTime({ tasks });
      if (!Array.isArray(timeFiltered)) return [];

      const filteredTasks = timeFiltered?.filter((task) => {
        const matchesSearch =
          !searchTerm.trim() ||
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === '전체' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
      });

      return filteredTasks;
    } catch (error) {
      console.error('태스크 필터링 오류:', error);
      return [];
    }
  }, [tasks, searchTerm, filterCategory]);

  // 태스크 수정
  const handleEditTask = useCallback(
    (task: Task): void => {
      try {
        setEditingTask(task);
        setNewTask({ ...task });
        setValidationErrors({});
        openModal(setShowAddTask);
      } catch (error) {
        console.error('태스크 수정 모드 오류:', error);
        setError('일정을 수정할 수 없습니다.');
      }
    },
    [openModal],
  );

  // 태스크 삭제
  const handleDeleteTask = useCallback((taskId: number): void => {
    try {
      if (window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
        const updateTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updateTasks);
      }
    } catch (error) {
      console.error('태스크 삭제 오류:', error);
      setError('일정을 삭제할 수 없습니다.');
    }
  }, []);

  // 태스크 상태 변경
  const toggleTaskStatus = useCallback(
    (taskId: number): void => {
      try {
        const updateTasks = tasks.map((task) => {
          if (task.id === taskId) {
            const newStatus = task.status === '완료' ? '진행중' : '완료';
            return { ...task, status: newStatus };
          }
          return task;
        });
        setTasks(updateTasks as Task[]);
      } catch (error) {
        console.error('상태 변경 오류:', error);
        setError('일정 상태를 변경할 수 없습니다.');
      }
    },
    [tasks],
  );

  // 기타 유틸리티 함수들
  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case '높음':
        return 'text-red-600 bg-red-50 border-red-200';
      case '중간':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case '낮음':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case '완료':
        return 'text-green-600 bg-green-50 border-green-200';
      case '진행중':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case '대기':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case '보류':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getTimeFilterLabel = useCallback((): string => {
    try {
      switch (timeFilter) {
        case 'day':
          return selectedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        case 'month':
          return selectedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
          });
        case 'year':
          return selectedDate.getFullYear() + '년';
        default:
          return '전체 기간';
      }
    } catch (error) {
      console.error('시간 필터 레이블 오류:', error);
      return '전체 기간';
    }
  }, [timeFilter, selectedDate]);

  return (
    <div className="space-y-4">
      <Card>
        <Card.Content className="pt-6">
          <h3 className="font-medium text-gray-800">
            {getTimeFilterLabel()} 일정 ({filteredTasks.length}개)
            {searchTerm && <span className="text-blue-600 ml-2">"{searchTerm}" 검색 결과</span>}
          </h3>
        </Card.Content>
      </Card>

      {filteredTasks.length === 0 ? (
        <Card>
          <Card.Content className="pt-6 text-center py-12">
            <div className="text-gray-400 mb-2 text-4xl">📋</div>
            <p className="text-gray-500">
              {searchTerm ? '검색 조건에 맞는 일정이 없습니다.' : '등록된 일정이 없습니다.'}
            </p>
            {searchTerm && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setSearchTerm('')}>
                검색 초기화
              </Button>
            )}
          </Card.Content>
        </Card>
      ) : (
        filteredTasks.map((task) => (
          <Card key={task.id}>
            <Card.Content className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={task.status === '완료' ? 'text-green-600' : 'text-gray-400'}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </Button>

                    <h3
                      className={`text-lg font-semibold ${
                        task.status === '완료' ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}
                    >
                      {task.title}
                    </h3>

                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: CATEGORY_COLORS[task.category] + '20',
                        color: CATEGORY_COLORS[task.category],
                        border: `1px solid ${CATEGORY_COLORS[task.category]}30`,
                      }}
                    >
                      {task.category}
                    </Badge>
                  </div>

                  <p className="text-gray-600 mb-3">{task.description}</p>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      우선순위: {task.priority}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge variant="outline" className="text-gray-500">
                      📅 {task.startDate}
                      {task.endDate && task.startDate !== task.endDate && ` ~ ${task.endDate}`}
                    </Badge>
                    {task.startTime && (
                      <Badge variant="outline" className="text-gray-500">
                        🕐 {task.startTime} - {task.endTime}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-gray-500">
                      ⏱️ 예상: {task.estimatedHours}시간
                      {task.actualHours > 0 && ` / 실제: ${task.actualHours}시간`}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))
      )}
    </div>
  );
};

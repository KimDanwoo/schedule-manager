import { CATEGORIES, CATEGORY_COLORS, PRIORITIES, STATUSES } from '@/constants';
import { useErrorStore, useFilterStore, useTaskStore, useUiStore, useValidationStore } from '@/stores';
import type { Task, ValidationErrors } from '@/types';
import { BarChart3, Calendar, ChevronLeft, ChevronRight, Clock, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, type ChangeEvent, type FC, type RefObject } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Input, Label, Select, Textarea } from '../atoms';
import { Card, ErrorMessage } from '../molecules';

interface HomeLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: FC<HomeLayoutProps> = ({ children }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const error = useErrorStore((state) => state.error);
  const setError = useErrorStore((state) => state.setError);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);
  const setShowAddTask = useTaskStore((state) => state.setShowAddTask);
  const timeFilter = useFilterStore((state) => state.timeFilter);
  const setTimeFilter = useFilterStore((state) => state.setTimeFilter);
  const setSelectedDate = useFilterStore((state) => state.setSelectedDate);
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const filterCategory = useFilterStore((state) => state.filterCategory);
  const setFilterCategory = useFilterStore((state) => state.setFilterCategory);
  const selectedDate = useFilterStore((state) => state.selectedDate);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const showAddTask = useTaskStore((state) => state.showAddTask);
  const editingTask = useTaskStore((state) => state.editingTask);
  const setEditingTask = useTaskStore((state) => state.setEditingTask);
  const newTask = useTaskStore((state) => state.newTask);
  const setNewTask = useTaskStore((state) => state.setNewTask);
  const validationErrors = useValidationStore((state) => state.validationErrors);
  const setValidationErrors = useValidationStore((state) => state.setValidationErrors);
  const showDayModal = useTaskStore((state) => state.showDayModal);
  const setShowDayModal = useTaskStore((state) => state.setShowDayModal);
  const selectedDayDate = useFilterStore((state) => state.selectedDayDate);
  const selectedDayTasks = useTaskStore((state) => state.selectedDayTasks);

  const navigate = useNavigate();
  const currentPage = useLocation().pathname;

  const navigatePage = useCallback((page: string) => {
    navigate(page);
  }, []);

  // 입력 유효성 검사
  const validateTask = useCallback((task: Task): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!task.title?.trim()) {
      errors.title = '제목을 입력해주세요.';
    }

    if (!task.startDate) {
      errors.startDate = '시작일을 선택해주세요.';
    }

    if (task.endDate && task.startDate && new Date(task.endDate) < new Date(task.startDate)) {
      errors.endDate = '종료일은 시작일보다 늦어야 합니다.';
    }

    if (task.startTime && task.endTime && task.startDate === task.endDate) {
      const startTime = new Date(`2000-01-01T${task.startTime}`);
      const endTime = new Date(`2000-01-01T${task.endTime}`);
      if (endTime <= startTime) {
        errors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다.';
      }
    }

    if (task.estimatedHours < 0) {
      errors.estimatedHours = '예상 시간은 0 이상이어야 합니다.';
    }

    if (task.actualHours < 0) {
      errors.actualHours = '실제 시간은 0 이상이어야 합니다.';
    }

    return errors;
  }, []);

  const navigateDate = useCallback(
    (direction: number): void => {
      try {
        const newDate = new Date(selectedDate);
        switch (timeFilter) {
          case 'day':
            newDate.setDate(newDate.getDate() + direction);
            break;
          case 'month':
            newDate.setMonth(newDate.getMonth() + direction);
            break;
          case 'year':
            newDate.setFullYear(newDate.getFullYear() + direction);
            break;
        }
        setSelectedDate(newDate);
      } catch (error) {
        console.error('날짜 네비게이션 오류:', error);
        setError('날짜를 변경할 수 없습니다.');
      }
    },
    [selectedDate, timeFilter],
  );
  // 태스크 추가
  const handleAddTask = useCallback((): void => {
    try {
      const errors = validateTask(newTask);
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      const task: Task = {
        ...newTask,
        id: Date.now(),
        actualHours: newTask.actualHours || 0,
      };
      const updateTasks = [...tasks, task];
      setTasks(updateTasks);
      closeModal(setShowAddTask, () => {
        setNewTask({
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
        });
        setValidationErrors({});
      });
    } catch (error) {
      console.error('태스크 추가 오류:', error);
      setError('일정을 추가할 수 없습니다.');
    }
  }, [newTask, validateTask, closeModal]);

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

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleUpdateTask = useCallback((): void => {
    try {
      const errors = validateTask(newTask);
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      if (!editingTask) return;

      const updateTasks = tasks.map((task) => (task.id === editingTask.id ? { ...newTask, id: editingTask.id } : task));
      setTasks(updateTasks);

      closeModal(setShowAddTask, () => {
        setEditingTask(null);
        setNewTask({
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
        });
        setValidationErrors({});
      });
    } catch (error) {
      console.error('태스크 수정 오류:', error);
      setError('일정을 수정할 수 없습니다.');
    }
  }, [newTask, editingTask, validateTask, closeModal]);

  const mountedRef = useRef<boolean>(true);

  // 오류 자동 해제
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setError('');
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 날짜별 일정 모달
  const DayModal: FC = () => {
    if (!showDayModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>
                {new Date(selectedDayDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                일정
              </Card.Title>
              <Button variant="ghost" size="icon" onClick={() => closeModal(setShowDayModal)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="space-y-3">
            {selectedDayTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">이 날에는 일정이 없습니다.</p>
            ) : (
              selectedDayTasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
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
                  {task.description && <p className="text-gray-600 text-sm mb-2">{task.description}</p>}
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    {task.startTime && task.endTime && (
                      <Badge variant="outline" className="text-gray-500">
                        {task.startTime} - {task.endTime}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card.Content>
        </Card>
      </div>
    );
  };

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

  console.log(currentPage);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <Card className="mb-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-2xl">📅 스케줄 매니저</Card.Title>
              <Button onClick={() => openModal(setShowAddTask)}>
                <Plus className="mr-2 h-4 w-4" />새 일정 추가
              </Button>
            </div>

            {/* 네비게이션 */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(['/', '/calendar', '/analytics'] as const).map((view) => (
                <Button
                  key={view}
                  variant={currentPage === view ? 'default' : 'outline'}
                  onClick={() => navigatePage(`${view}`)}
                >
                  {view === '/' && <Clock className="mr-2 h-4 w-4" />}
                  {view === '/calendar' && <Calendar className="mr-2 h-4 w-4" />}
                  {view === '/analytics' && <BarChart3 className="mr-2 h-4 w-4" />}
                  {view === '/' && '할 일 목록'}
                  {view === '/calendar' && '캘린더'}
                  {view === '/analytics' && '분석'}
                </Button>
              ))}
            </div>

            {/* 시간 필터 */}
            {(currentPage === '/' || currentPage === '/analytics') && (
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'all', label: '전체' },
                      { value: 'day', label: '일별' },
                      { value: 'month', label: '월별' },
                      { value: 'year', label: '연별' },
                    ] as const
                  ).map((filter) => (
                    <Button
                      key={filter.value}
                      variant={timeFilter === filter.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>

                {timeFilter !== 'all' && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                      {getTimeFilterLabel()}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      오늘
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 검색 및 필터 */}
            {currentPage === '/' && (
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      key="search-input"
                      ref={searchInputRef as RefObject<HTMLInputElement>}
                      placeholder="일정 검색..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </Card.Header>
        </Card>

        {children}

        {/* 일정 추가/편집 모달 */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>{editingTask ? '일정 수정' : '새 일정 추가'}</Card.Title>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      closeModal(setShowAddTask, () => {
                        setEditingTask(null);
                        setNewTask({
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
                        });
                        setValidationErrors({});
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <Label error={!!validationErrors.title}>제목 *</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="일정 제목을 입력하세요"
                    error={!!validationErrors.title}
                  />
                  {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
                </div>

                <div>
                  <Label>설명</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="일정 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>카테고리</Label>
                    <Select
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== '전체').map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label>우선순위</Label>
                    <Select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>상태</Label>
                  <Select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label error={!!validationErrors.startDate}>시작일 *</Label>
                    <Input
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                      error={!!validationErrors.startDate}
                    />
                    {validationErrors.startDate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <Label error={!!validationErrors.endDate}>종료일</Label>
                    <Input
                      type="date"
                      value={newTask.endDate}
                      onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                      error={!!validationErrors.endDate}
                    />
                    {validationErrors.endDate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label error={!!validationErrors.startTime}>시작 시간</Label>
                    <Input
                      type="time"
                      value={newTask.startTime}
                      onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                      error={!!validationErrors.startTime}
                    />
                    {validationErrors.startTime && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.startTime}</p>
                    )}
                  </div>

                  <div>
                    <Label error={!!validationErrors.endTime}>종료 시간</Label>
                    <Input
                      type="time"
                      value={newTask.endTime}
                      onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                      error={!!validationErrors.endTime}
                    />
                    {validationErrors.endTime && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.endTime}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label error={!!validationErrors.estimatedHours}>예상 시간 (시간)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTask.estimatedHours}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          estimatedHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      error={!!validationErrors.estimatedHours}
                    />
                    {validationErrors.estimatedHours && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.estimatedHours}</p>
                    )}
                  </div>

                  <div>
                    <Label error={!!validationErrors.actualHours}>실제 소요 시간 (시간)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTask.actualHours}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          actualHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      error={!!validationErrors.actualHours}
                    />
                    {validationErrors.actualHours && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.actualHours}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={editingTask ? handleUpdateTask : handleAddTask} className="flex-1">
                    {editingTask ? '수정하기' : '추가하기'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      closeModal(setShowAddTask, () => {
                        setEditingTask(null);
                        setNewTask({
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
                        });
                        setValidationErrors({});
                      })
                    }
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}

        <DayModal />
      </div>
    </div>
  );
};

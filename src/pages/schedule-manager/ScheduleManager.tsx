import type {
  AnalyticsData,
  CategoryStat,
  ErrorMessageProps,
  PriorityStat,
  StatusStat,
  Task,
  ValidationErrors,
} from '@/types/index';
import { Badge, Button, Input, Label, Select, Textarea } from '@components/atoms';
import { Card } from '@components/molecules';
import { CATEGORIES, CATEGORY_COLORS, PRIORITIES, STATUSES } from '@constants/index';
import { useTaskStore } from '@stores/index';
import { fcDateToLocal, formatDateToLocal, formatTimeToLocal, isSameDate } from '@utils/date';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FC, type RefObject } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const ScheduleManager: FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const showAddTask = useTaskStore((state) => state.showAddTask);
  const setShowAddTask = useTaskStore((state) => state.setShowAddTask);
  const showDayModal = useTaskStore((state) => state.showDayModal);
  const setShowDayModal = useTaskStore((state) => state.setShowDayModal);
  const selectedDayTasks = useTaskStore((state) => state.selectedDayTasks);
  const setSelectedDayTasks = useTaskStore((state) => state.setSelectedDayTasks);
  const editingTask = useTaskStore((state) => state.editingTask);
  const setEditingTask = useTaskStore((state) => state.setEditingTask);

  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'analytics'>('list');
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [calendarLoaded, setCalendarLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Refs
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstance = useRef<any>(null);
  const scrollPositionRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 상수들을 useMemo로 최적화

  const [newTask, setNewTask] = useState<Task>({
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

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, []);

  // 오류 자동 해제
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setError(null);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 검색 핸들러 최적화 (포커스 문제 해결)
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  // 모달 관리 함수들 수정 (body overflow 관리만)
  const openModal = useCallback((modalSetter: (value: boolean) => void) => {
    try {
      if (typeof window !== 'undefined') {
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      }
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
      modalSetter(true);
    } catch (error) {
      console.error('모달 열기 오류:', error);
      setError('모달을 열 수 없습니다.');
    }
  }, []);

  const closeModal = useCallback((modalSetter: (value: boolean) => void, resetFunction?: () => void) => {
    try {
      modalSetter(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
      if (resetFunction) resetFunction();

      setTimeout(() => {
        if (mountedRef.current && typeof window !== 'undefined') {
          window.scrollTo(0, scrollPositionRef.current);
        }
      }, 100);
    } catch (error) {
      console.error('모달 닫기 오류:', error);
      setError('모달을 닫을 수 없습니다.');
    }
  }, []);

  // FullCalendar 로드
  useEffect(() => {
    const loadFullCalendar = async (): Promise<void> => {
      try {
        if (typeof window === 'undefined') return;

        if (window.FullCalendar) {
          setCalendarLoaded(true);
          return;
        }

        setIsLoading(true);

        // FullCalendar CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/6.1.8/index.min.css';
        document.head.appendChild(link);

        // FullCalendar JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/6.1.8/index.global.min.js';
        script.onload = () => {
          if (mountedRef.current) {
            setCalendarLoaded(true);
            setIsLoading(false);
          }
        };
        script.onerror = () => {
          if (mountedRef.current) {
            setError('FullCalendar 라이브러리를 로드할 수 없습니다.');
            setIsLoading(false);
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('FullCalendar 로드 오류:', error);
        if (mountedRef.current) {
          setError('캘린더를 초기화할 수 없습니다.');
          setIsLoading(false);
        }
      }
    };

    loadFullCalendar();
  }, []);

  // FullCalendar 초기화 수정 (모달 상태와 무관하게 초기화)
  useEffect(() => {
    if (calendarLoaded && calendarRef.current && currentView === 'calendar') {
      const timer = setTimeout(() => {
        initializeCalendar();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [calendarLoaded, currentView]);

  // 태스크 변경시 캘린더 업데이트 (모달 상태와 무관)
  useEffect(() => {
    if (calendarInstance.current && currentView === 'calendar') {
      updateCalendarEvents();
    }
  }, [tasks, currentView]);

  const initializeCalendar = (): void => {
    try {
      if (calendarInstance.current) {
        calendarInstance.current.destroy();
        calendarInstance.current = null;
      }

      if (!window.FullCalendar || !calendarRef.current || !mountedRef.current) {
        return;
      }

      calendarInstance.current = new window.FullCalendar.Calendar(calendarRef.current, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        },
        locale: 'ko',
        height: 'auto',
        editable: true,
        droppable: true,
        selectable: true,
        selectMirror: true,
        events: [],
        dayMaxEvents: 3,
        timeZone: 'local',

        // 이벤트 드래그 & 드롭 (캘린더 파괴 방지)
        eventDrop: (info: any) => {
          try {
            const taskId = parseInt(info.event.id);
            const newStart = info.event.start;
            const originalTask = info.event.extendedProps.originalTask;

            if (!mountedRef.current) return;

            // 캘린더 재렌더링을 방지하기 위해 상태 업데이트를 setTimeout으로 감싸기
            setTimeout(() => {
              setTasks((prevTasks) =>
                prevTasks.map((task) => {
                  if (task.id === taskId) {
                    const isAllDay = info.event.allDay;
                    let updatedTask = { ...task };

                    if (isAllDay) {
                      updatedTask.startDate = fcDateToLocal(newStart);
                      if (originalTask.startDate !== originalTask.endDate) {
                        const originalDuration = Math.floor(
                          (new Date(originalTask.endDate).getTime() - new Date(originalTask.startDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        const newEndDate = new Date(newStart);
                        newEndDate.setDate(newEndDate.getDate() + originalDuration);
                        updatedTask.endDate = fcDateToLocal(newEndDate);
                      } else {
                        updatedTask.endDate = fcDateToLocal(newStart);
                      }
                      updatedTask.startTime = '';
                      updatedTask.endTime = '';
                    } else {
                      updatedTask.startDate = fcDateToLocal(newStart);
                      updatedTask.endDate = fcDateToLocal(newStart);
                      updatedTask.startTime = formatTimeToLocal(newStart);
                      if (info.event.end) {
                        updatedTask.endTime = formatTimeToLocal(info.event.end);
                      }
                    }

                    return updatedTask;
                  }
                  return task;
                }),
              );
            }, 0);
          } catch (error) {
            console.error('이벤트 드롭 오류:', error);
            setError('일정을 이동할 수 없습니다.');
            info.revert();
          }
        },

        // 이벤트 클릭
        eventClick: (info: any) => {
          try {
            const taskId = parseInt(info.event.id);
            const task = tasks.find((t) => t.id === taskId);
            if (task && mountedRef.current) {
              setEditingTask(task);
              setNewTask({ ...task });
              setValidationErrors({});
              openModal(setShowAddTask);
            }
          } catch (error) {
            console.error('이벤트 클릭 오류:', error);
            setError('일정을 열 수 없습니다.');
          }
        },

        // 빈 공간 클릭
        select: (info: any) => {
          try {
            if (!mountedRef.current) return;

            const startDate = fcDateToLocal(info.start);
            const endDate = info.end ? fcDateToLocal(new Date(info.end.getTime() - 24 * 60 * 60 * 1000)) : startDate;
            const startTime = info.allDay ? '' : formatTimeToLocal(info.start);
            const endTime = info.allDay ? '' : info.end ? formatTimeToLocal(info.end) : '10:00';

            setNewTask((prev) => ({
              ...prev,
              startDate: startDate,
              endDate: endDate,
              startTime: startTime,
              endTime: endTime,
            }));

            openModal(setShowAddTask);
          } catch (error) {
            console.error('날짜 선택 오류:', error);
            setError('새 일정을 만들 수 없습니다.');
          }
        },

        // 더보기 클릭
        moreLinkClick: (info: any) => {
          try {
            if (!mountedRef.current) return;

            const dateStr = fcDateToLocal(info.date);
            const dayTasks = tasks.filter((task) => {
              const taskStart = new Date(task.startDate);
              const taskEnd = new Date(task.endDate || task.startDate);
              const clickedDate = new Date(dateStr);
              return clickedDate >= taskStart && clickedDate <= taskEnd;
            });

            setSelectedDayTasks(dayTasks);
            setSelectedDayDate(dateStr);
            openModal(setShowDayModal);
            return 'popover';
          } catch (error) {
            console.error('더보기 클릭 오류:', error);
            setError('날짜별 일정을 표시할 수 없습니다.');
          }
        },

        // 한국어 설정
        buttonText: {
          today: '오늘',
          month: '월',
          week: '주',
          day: '일',
        },

        // 이벤트 렌더링
        eventContent: (arg: any) => {
          try {
            const { event } = arg;
            const status = event.extendedProps.status;
            const statusIcon = status === '완료' ? '✅' : status === '진행중' ? '🔄' : '⏳';

            return {
              html: `
                <div class="fc-event-main-frame">
                  <div class="fc-event-title-container">
                    <div class="fc-event-title fc-sticky">
                      ${statusIcon} ${event.title}
                    </div>
                  </div>
                </div>
              `,
            };
          } catch (error) {
            console.error('이벤트 렌더링 오류:', error);
            return { html: '<div>오류</div>' };
          }
        },
      });

      calendarInstance.current.render();
      updateCalendarEvents();
    } catch (error) {
      console.error('캘린더 초기화 오류:', error);
      setError('캘린더를 초기화할 수 없습니다.');
    }
  };

  const updateCalendarEvents = (): void => {
    if (!calendarInstance.current || !mountedRef.current) return;

    try {
      calendarInstance.current.removeAllEvents();

      if (!Array.isArray(tasks)) return;

      const events = tasks
        .map((task) => {
          try {
            const isMultiDay = task.startDate !== task.endDate && task.endDate;
            let start: string, end: string;

            if (isMultiDay) {
              start = task.startDate;
              const endDate = new Date(task.endDate);
              endDate.setDate(endDate.getDate() + 1);
              end = formatDateToLocal(endDate);
            } else {
              if (task.startTime && task.endTime) {
                start = `${task.startDate}T${task.startTime}`;
                end = `${task.startDate}T${task.endTime}`;
              } else {
                start = task.startDate;
                end = task.startDate;
              }
            }

            return {
              id: task.id.toString(),
              title: task.title,
              start: start,
              end: end,
              allDay: isMultiDay || (!task.startTime && !task.endTime),
              backgroundColor: CATEGORY_COLORS[task.category] || '#6B7280',
              borderColor: CATEGORY_COLORS[task.category] || '#6B7280',
              textColor: '#ffffff',
              extendedProps: {
                description: task.description,
                category: task.category,
                priority: task.priority,
                status: task.status,
                estimatedHours: task.estimatedHours,
                actualHours: task.actualHours,
                originalTask: task,
              },
            };
          } catch (error) {
            console.error('이벤트 변환 오류:', error, task);
            return null;
          }
        })
        .filter(Boolean);

      calendarInstance.current.addEventSource(events);
    } catch (error) {
      console.error('캘린더 이벤트 업데이트 오류:', error);
    }
  };

  // 시간 필터에 따른 태스크 필터링
  const getFilteredTasksByTime = useCallback(
    (tasks: Task[]): Task[] => {
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

  // 검색 및 카테고리 필터링된 태스크
  const filteredTasks = useMemo((): Task[] => {
    try {
      const timeFiltered = getFilteredTasksByTime(tasks);

      if (!Array.isArray(timeFiltered)) return [];

      return timeFiltered?.filter((task) => {
        const matchesSearch =
          !searchTerm.trim() ||
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === '전체' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
      });
    } catch (error) {
      console.error('태스크 필터링 오류:', error);
      return [];
    }
  }, [tasks, searchTerm, filterCategory, getFilteredTasksByTime]);

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

      setTasks((prevTasks) => [...prevTasks, task]);
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

  const handleUpdateTask = useCallback((): void => {
    try {
      const errors = validateTask(newTask);
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      if (!editingTask) return;

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === editingTask.id ? { ...newTask, id: editingTask.id } : task)),
      );

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

  // 태스크 삭제
  const handleDeleteTask = useCallback((taskId: number): void => {
    try {
      if (window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      console.error('태스크 삭제 오류:', error);
      setError('일정을 삭제할 수 없습니다.');
    }
  }, []);

  // 태스크 상태 변경
  const toggleTaskStatus = useCallback((taskId: number): void => {
    try {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === taskId) {
            const newStatus = task.status === '완료' ? '진행중' : '완료';
            return { ...task, status: newStatus };
          }
          return task;
        }),
      );
    } catch (error) {
      console.error('상태 변경 오류:', error);
      setError('일정 상태를 변경할 수 없습니다.');
    }
  }, []);

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

  // 분석 데이터 생성
  const analyticsData = useMemo((): AnalyticsData => {
    const filteredByTime = getFilteredTasksByTime(tasks);

    if (!Array.isArray(filteredByTime))
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        categoryStats: [],
        statusStats: [],
        priorityStats: [],
      };

    // 카테고리별 통계
    const categoryStats: CategoryStat[] = CATEGORIES.slice(1).map((category) => {
      const categoryTasks = filteredByTime.filter((task) => task.category === category);
      return {
        name: category,
        count: categoryTasks.length,
        completed: categoryTasks.filter((task) => task.status === '완료').length,
        color: CATEGORY_COLORS[category],
      };
    });

    // 상태별 통계
    const statusStats: StatusStat[] = STATUSES.map((status) => {
      const statusTasks = filteredByTime.filter((task) => task.status === status);
      return {
        name: status,
        count: statusTasks.length,
      };
    });

    // 우선순위별 통계
    const priorityStats: PriorityStat[] = PRIORITIES.map((priority) => {
      const priorityTasks = filteredByTime.filter((task) => task.priority === priority);
      return {
        name: priority,
        count: priorityTasks.length,
      };
    });

    return {
      total: filteredByTime.length,
      completed: filteredByTime.filter((task) => task.status === '완료').length,
      inProgress: filteredByTime.filter((task) => task.status === '진행중').length,
      pending: filteredByTime.filter((task) => task.status === '대기').length,
      categoryStats,
      statusStats,
      priorityStats,
    };
  }, [tasks, getFilteredTasksByTime, CATEGORIES, STATUSES, PRIORITIES, CATEGORY_COLORS]);

  // 오류 메시지 컴포넌트
  const ErrorMessage: FC<ErrorMessageProps> = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{message}</span>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="ml-4 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <Card className="mb-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-2xl">📅 스케줄 매니저</Card.Title>
              <Button onClick={() => openModal(setShowAddTask)} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />새 일정 추가
              </Button>
            </div>

            {/* 네비게이션 */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(['list', 'calendar', 'analytics'] as const).map((view) => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'outline'}
                  onClick={() => setCurrentView(view)}
                  disabled={isLoading}
                >
                  {view === 'list' && <Clock className="mr-2 h-4 w-4" />}
                  {view === 'calendar' && <Calendar className="mr-2 h-4 w-4" />}
                  {view === 'analytics' && <BarChart3 className="mr-2 h-4 w-4" />}
                  {view === 'list' && '할 일 목록'}
                  {view === 'calendar' && '캘린더'}
                  {view === 'analytics' && '분석'}
                </Button>
              ))}
            </div>

            {/* 시간 필터 */}
            {(currentView === 'list' || currentView === 'analytics') && (
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
            {currentView === 'list' && (
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

        {/* 메인 컨텐츠 */}
        {currentView === 'list' && (
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
        )}

        {currentView === 'calendar' && (
          <Card>
            <Card.Content className="pt-6">
              {!calendarLoaded || isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">FullCalendar 로딩 중...</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>업무</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>학습</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>건강</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                        <span>개인</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded"></div>
                        <span>기타</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 팁: 일정을 드래그해서 이동하거나, 빈 공간을 클릭해서 새 일정을 추가하세요! 기간이 있는 일정은
                      자동으로 바 형태로 표시됩니다.
                    </p>
                  </div>
                  <div ref={calendarRef} className="fullcalendar-container"></div>
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {currentView === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <Card.Content className="pt-6">
                <h3 className="font-medium text-gray-800">{getTimeFilterLabel()} 분석</h3>
              </Card.Content>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <Card.Content className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{analyticsData.total}</div>
                  <div className="text-sm text-gray-500">총 일정</div>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{analyticsData.completed}</div>
                  <div className="text-sm text-gray-500">완료된 일정</div>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-1">{analyticsData.inProgress}</div>
                  <div className="text-sm text-gray-500">진행중 일정</div>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="pt-6 text-center">
                  <div className="text-3xl font-bold text-gray-500 mb-1">{analyticsData.pending}</div>
                  <div className="text-sm text-gray-500">대기중 일정</div>
                </Card.Content>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <Card.Title>카테고리별 일정</Card.Title>
                </Card.Header>
                <Card.Content>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>상태별 일정</Card.Title>
                </Card.Header>
                <Card.Content>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.statusStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#6B7280', '#EF4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Content>
              </Card>
            </div>
          </div>
        )}

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
                  <Button
                    onClick={editingTask ? handleUpdateTask : handleAddTask}
                    className="flex-1"
                    disabled={isLoading}
                  >
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

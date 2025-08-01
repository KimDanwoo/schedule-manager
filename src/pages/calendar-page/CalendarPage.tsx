import { Card } from '@/components/molecules';
import { CATEGORY_COLORS } from '@/constants';
import { useErrorStore, useFilterStore, useTaskStore, useUiStore, useValidationStore } from '@/stores';
import type { Task } from '@/types';
import { fcDateToLocal, formatDateToLocal, formatTimeToLocal } from '@utils/date';
import { useEffect, useRef } from 'react';

export const CalendarPage = () => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstance = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);

  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const newTask = useTaskStore((state) => state.newTask);
  const setNewTask = useTaskStore((state) => state.setNewTask);
  const setError = useErrorStore((state) => state.setError);
  const setEditingTask = useTaskStore((state) => state.setEditingTask);
  const setValidationErrors = useValidationStore((state) => state.setValidationErrors);
  const setShowAddTask = useTaskStore((state) => state.setShowAddTask);
  const setShowDayModal = useTaskStore((state) => state.setShowDayModal);
  const setSelectedDayTasks = useTaskStore((state) => state.setSelectedDayTasks);
  const setSelectedDayDate = useFilterStore((state) => state.setSelectedDayDate);
  const openModal = useUiStore((state) => state.openModal);

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

        eventDrop: (info: any) => {
          try {
            const taskId = parseInt(info.event.id);
            const newStart = info.event.start;
            const originalTask = info.event.extendedProps.originalTask;

            if (!mountedRef.current) return;

            const updateTasks = tasks.map((task: Task) => {
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
            });
            setTasks(updateTasks);
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

            const updatedNewTask = {
              ...newTask,
              startDate: startDate,
              endDate: endDate,
              startTime: startTime,
              endTime: endTime,
            };
            setNewTask(updatedNewTask);

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

  useEffect(() => {
    if (calendarRef.current) {
      const timer = setTimeout(() => {
        initializeCalendar();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tasks, updateCalendarEvents]);

  return (
    <Card>
      <Card.Content className="pt-6">
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
              💡 팁: 일정을 드래그해서 이동하거나, 빈 공간을 클릭해서 새 일정을 추가하세요! 기간이 있는 일정은 자동으로
              바 형태로 표시됩니다.
            </p>
          </div>
          <div ref={calendarRef} className="fullcalendar-container"></div>
        </div>
      </Card.Content>
    </Card>
  );
};

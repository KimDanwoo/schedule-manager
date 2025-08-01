import { Card } from '@/components/molecules';
import { CATEGORIES, CATEGORY_COLORS, PRIORITIES, STATUSES } from '@/constants';
import { useFilteredTask } from '@/hooks/useFilteredTask';
import { useFilterStore, useTaskStore } from '@/stores';
import type { AnalyticsData, CategoryStat, PriorityStat, StatusStat } from '@/types';
import { useCallback, useMemo } from 'react';
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

export const AnalyticsPage = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const { getFilteredTasksByTime } = useFilteredTask();
  const timeFilter = useFilterStore((state) => state.timeFilter);
  const selectedDate = useFilterStore((state) => state.selectedDate);

  // 분석 데이터 생성
  const analyticsData = useMemo((): AnalyticsData => {
    const filteredByTime = getFilteredTasksByTime({ tasks });

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
  );
};

// 타입 정의
export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: '낮음' | '중간' | '높음';
  status: '대기' | '진행중' | '완료' | '보류';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  estimatedHours: number;
  actualHours: number;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface AnalyticsData {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  categoryStats: CategoryStat[];
  statusStats: StatusStat[];
  priorityStats: PriorityStat[];
}

export interface CategoryStat {
  name: string;
  count: number;
  completed: number;
  color: string;
}

export interface StatusStat {
  name: string;
  count: number;
}

export interface PriorityStat {
  name: string;
  count: number;
}

export interface CategoryColors {
  [key: string]: string;
}


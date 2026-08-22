export type Role = "student" | "teacher" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface QuizSummary {
  quiz_id: number;
  title: string;
  description: string;
  total_questions: number;
}

export interface QuizQuestion {
  question_id: number;
  question: string;
  options: string[];
  topic: string;
  difficulty: "easy" | "intermediate" | "hard" | string;
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[];
}

export interface TopicPerformance {
  correct_answers?: number;
  attempted_questions?: number;
  accuracy?: number;
  average_time_seconds?: number;
  performance_status?: string;
}

export interface Attempt {
  id: number;
  student_id: number;
  quiz_id: number;
  correct_answers: number;
  attempted_questions: number;
  score_percentage: number;
  average_time_seconds: number;
  learning_level: string;
  topic_analysis: Record<string, TopicPerformance>;
  weak_topics: string[];
  strong_topics: string[];
  recommendations: Array<string | { topic?: string; recommendation?: string }>;
  created_at: string;
}

export interface StudentDashboard {
  student?: User;
  performance?: {
    total_attempts?: number;
    average_score_percentage?: number;
    highest_score_percentage?: number;
  };
  latest_attempt?: Attempt;
  [key: string]: unknown;
}

export interface StudentSummary {
  student_id: number;
  student_name: string;
  student_email: string;
  total_attempts: number;
  average_score_percentage: number;
  highest_score_percentage: number;
  lowest_score_percentage: number;
  latest_score_percentage: number;
  latest_learning_level: string;
  latest_weak_topics: string[];
  latest_strong_topics: string[];
  latest_recommendations: Array<
    string | { topic?: string; recommendation?: string }
  >;
}

export interface AttemptResult extends Attempt {
  attempt_id?: number;
  message?: string;
}

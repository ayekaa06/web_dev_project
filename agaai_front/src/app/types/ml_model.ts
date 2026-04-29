export type Dependency = {
  name: string;
  requirement: string;
  url?: string;
};

export type Benchmark = {
  name: string;
  description: string;
  value: number;
};

export type Prompt = {
  name: string;
  prompt_template: string;
};

export type Badge = {
  name: string;
  description: string;
};

export type UserSummary = {
  id: string;
  username: string;
};

export type ListModel = {
  record_id: number;
  model_fullref: number;
  custom_name: string;
  description: string;
  badges?: Badge[] | null;
};

export type MLModel = {
  id: number;
  author: string;
  version: string;
  model_name: string;
  param_count: number | null;
  is_quantized: boolean;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ArchitectureFile = {
  id: number;
  file: string;
  description: string;
};

export type UseCase = {
  id: number;
  user: UserSummary;
  model_fullref: MLModel;
  sphere: string;
  tags: string[];
  is_model_modified: boolean;
  description: string;
  datasets: string[];
  created_at: string;
};

export type UserReview = {
  id: number;
  user: UserSummary;
  model_fullref: MLModel;
  review_text: string;
  rank: number;
  created_at: string;
  updated_at: string;
};

export type UseCaseInput = {
  sphere: string;
  tags?: string[];
  is_model_modified?: boolean;
  description: string;
  datasets?: string[];
  model_id?: number;
};

export type UserReviewInput = {
  review_text?: string;
  rank?: number;
  model_id?: number;
};

export type Model = {
  record_id: number;
  model_fullref: MLModel;
  custom_name: string;
  uniq_name: string;
  description: string;
  custom_note: string | null;
  badges?: Badge[] | null;
  prompts?: Prompt[] | null;
  dependencies?: Dependency[] | null;
  architecture?: ArchitectureFile[] | null;
  profiling?: Profiling[] | null;
  benchmarks?: Benchmark[] | null;
  updated_at?: string;
  average_review_rank?: number | null;
};

export type Profiling = Omit<Benchmark, 'value'> & { value: string | null };


export interface AdvancedFilters {
  search?: string;
  author?: string;
  version?: string;
  model_name?: string;
  badge?: string;
  dependencies_has_key?: string;
  dependencies_not_has_key?: string;
  updated_after?: string;
  updated_before?: string;
  is_quantized?: string;
  param_count_gt?: string;
  param_count_lt?: string;
  benchmark_name?: string;
  benchmark_value_gt?: string;
  benchmark_value_lt?: string;
  ordering?: string;
}

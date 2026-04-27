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

export type ArchitectureFile = {
  id: number;
  file: string;
  description: string;
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
  benchmark_score_gt?: string;
  benchmark_score_lt?: string;
  ordering?: string;
}
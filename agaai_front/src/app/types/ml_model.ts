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

export type Profiling = Omit<Benchmark, 'value'> & { value: string | null };

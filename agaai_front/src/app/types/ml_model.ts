export type Dependency = {
  name: string;
  requirement: string;
  url?: string;
}

export type Benchmark = {
  name: string;
  description: string;
  value: number;
}

export type Prompt = {
  name: string;
  description: string;
  content: string;
}

export type Profiling = Benchmark | {value: string | null;}
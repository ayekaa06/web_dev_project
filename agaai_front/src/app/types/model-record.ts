export type ApiId = number;

export type ModelFullRef = {
  id: ApiId;
  author: string;
  version: string;
  model_name: string;
  param_count: number | null;
  is_quantized: boolean;
};

export type ArchitectureFile = {
  id: ApiId;
  file: string;
  description: string;
};

export type Dependency = {
  name: string;
  requirement: string;
  url?: string;
};

export type Benchmark = {
  id?: ApiId;
  name: string;
  description?: string;
  source?: string;
  formula?: string;
  value?: number;
};

export type Prompt = {
  id?: ApiId;
  name?: string;
  prompt_template: string;
};

export type Badge = {
  id?: ApiId;
  name: string;
  description?: string;
};

export type BadgeValue = Badge | string;

export type Profiling = Omit<Benchmark, 'value'> & { value: string | number | null };

export type ModelRecord = {
  record_id: ApiId;
  model_fullref: ModelFullRef;
  custom_name: string;
  custom_note: string | null;
  description: string;
  dependencies?: Dependency[] | null;
  benchmarks?: Benchmark[] | null;
  profiling?: Profiling[] | null;
  prompts?: Prompt[] | null;
  badges?: BadgeValue[] | null;
  architecture?: ArchitectureFile[] | null;
};

export type ModelRecordList = Pick<
  ModelRecord,
  'record_id' | 'custom_name' | 'description' | 'badges'
> & {
  model_fullref: ModelFullRef['id'];
};

export type ModelRecordCreatePayload = Pick<
  ModelRecord,
  'custom_name' | 'description' | 'custom_note' | 'dependencies' | 'profiling'
> & {
  author: ModelFullRef['author'];
  version: ModelFullRef['version'];
  model_name: ModelFullRef['model_name'];
  prompts?: Prompt[] | null;
  badges?: string[] | null;
  benchmarks?: Benchmark[] | null;
};

export type ModelRecordUpdatePayload = Partial<
  Omit<ModelRecord, 'record_id' | 'model_fullref' | 'architecture'>
> &
  Partial<Pick<ModelFullRef, 'author' | 'version' | 'model_name'>>;

export function badgeName(badge: BadgeValue): string {
  return typeof badge === 'string' ? badge : badge.name;
}

export function badgeNames(badges: readonly BadgeValue[] | null | undefined): string[] {
  return badges?.map(badgeName).filter(Boolean) ?? [];
}

export function modelVersionLabel(record: Pick<ModelRecord, 'model_fullref'>): string {
  const model = record.model_fullref;
  return `${model.author}/${model.model_name}:${model.version}`;
}

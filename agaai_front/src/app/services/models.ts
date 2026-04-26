import { Injectable } from '@angular/core';

import { Benchmark, Dependency, Profiling, Prompt } from '../types/ml_model';

export type MLModel = {
  id: number;
  author: string;
  version: string;
  model_name: string;
  param_count: number | null;
  is_quantized: boolean;
};

export type Model = {
  record_id: number;
  model_fullref: MLModel;
  custom_name: string;
  uniq_name: string;
  description: string;
  custom_note: string | null;
  badges?: string[] | null;
  prompts?: Prompt[] | null;
  dependencies?: Dependency[] | null;
  profiling?: Profiling[] | null;
  architecture?: string[] | null;
  benchmarks?: Benchmark[] | null;
};

const MOCK_MODELS: Model[] = [
  // {
  //   record_id: 1,
  //   custom_name: 'GPT-4',
  //   uniq_name: 'gpt-4',
  //   description: 'Advanced reasoning model',
  //   custom_note: null,
  //   architecture: [],
  //   benchmarks: [
  //     { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 },
  //     { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 },
  //     { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 },
  //     { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 }
  //   ]
  // },
  // {
  //   record_id: 2,
  //   custom_name: 'LLaMA 2',
  //   uniq_name: 'llama-2',
  //   description: 'Open-source model',
  //   custom_note: null,
  //   architecture: ['Transformer'],
  //   benchmarks: [{ name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 75 }]
  // },
  // {
  //   record_id: 3,
  //   custom_name: 'Mistral',
  //   uniq_name: 'mistral',
  //   description: 'Fast AI model',
  //   custom_note: null,
  //   architecture: ['Transformer'],
  //   benchmarks: [{ name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 78 }]
  // }
];

const BASE_URL = '127.0.0.1:8000';

@Injectable({ providedIn: 'root' })
export class ModelsService {
  private models: Model[] = MOCK_MODELS;

  getAll(): Model[] {
    return this.models;
  }

  addModel(model: Model) {
    this.models = [...this.models, model];
  }

  getById(model_fullref: number): Model | undefined {
    return this.models.find((m) => m.model_fullref.id === model_fullref);
  }
}

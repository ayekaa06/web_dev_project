import { Injectable } from '@angular/core';

import { Benchmark, Dependency, Profiling } from '../types/ml_model';

export type Model = {
  id: number;
  name: string;
  uniq_name: string;
  description: string;
  custom_note: string | null;
  badges?: string[] | null;
  prompts?: string[] | null;
  dependencies?: Dependency[] | null;
  profiling?: Profiling[] | null;
  architecture?: string[] | null;
  benchmarks?: Benchmark[] | null;
}

const MOCK_MODELS: Model[] = [
    { 
      id: 1, 
      name: 'GPT-4', 
      uniq_name: 'gpt-4', 
      description: 'Advanced reasoning model', 
      custom_note: null,
      architecture: [], 
      benchmarks: [
        { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 },
        { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 },
        { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 },
        { name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 86 }
      ]
    },
    { 
      id: 2, 
      name: 'LLaMA 2', 
      uniq_name: 'llama-2', 
      description: 'Open-source model', 
      custom_note: null,
      architecture: ['Transformer'], 
      benchmarks: [{ name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 75 }]
    },
    { 
      id: 3, 
      name: 'Mistral', 
      uniq_name: 'mistral', 
      description: 'Fast AI model', 
      custom_note: null,
      architecture: ['Transformer'], 
      benchmarks: [{ name: 'MMLU', description: 'Massive Multitask Language Understanding', value: 78 }]
    }
  ];


const BASE_URL = "127.0.0.1:8000"

@Injectable({ providedIn: 'root' })
export class ModelsService {
  private models: Model[] = MOCK_MODELS;

  getAll(): Model[] { return this.models; }

  addModel(model: Model) {
    this.models = [...this.models, model];
  }

  getById(id: number): Model | undefined {
    return this.models.find(m => m.id === id);
  }

  getSaved(): Model[] {
    const ids = JSON.parse(localStorage.getItem('savedModels') || '[]');
    return this.models.filter(m => ids.includes(m.id));
  }

  toggleSave(id: number): boolean {
    const ids: number[] = JSON.parse(localStorage.getItem('savedModels') || '[]');
    let updated: number[];
    let saved: boolean;
    if (ids.includes(id)) {
      updated = ids.filter(i => i !== id);
      saved = false;
    } else {
      updated = [...ids, id];
      saved = true;
    }
    localStorage.setItem('savedModels', JSON.stringify(updated));
    return saved;
  }

  isSaved(id: number): boolean {
    const ids = JSON.parse(localStorage.getItem('savedModels') || '[]');
    return ids.includes(id);
  }
}

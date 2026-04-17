import { Injectable } from '@angular/core';

export interface Model {
  id: number;
  name: string;
  description: string;
  type: string;
  architecture: string;
  benchmarks: string;
}

@Injectable({ providedIn: 'root' })
export class ModelsService {
  private models: Model[] = [
    { id: 1, name: 'GPT-4', description: 'Advanced reasoning model', type: 'LLM', architecture: 'Transformer', benchmarks: 'MMLU: 86%' },
    { id: 2, name: 'LLaMA 2', description: 'Open-source model', type: 'Open-source', architecture: 'Transformer', benchmarks: 'MMLU: 75%' },
    { id: 3, name: 'Mistral', description: 'Fast AI model', type: 'Fast', architecture: 'Transformer', benchmarks: 'MMLU: 78%' }
  ];

  getAll(): Model[] { return this.models; }

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

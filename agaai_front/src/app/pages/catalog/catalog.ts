import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { ModelCard } from '../../components/model-card/model-card';
import { Benchmark, Dependency, Profiling, Prompt } from '../../types/ml_model';

type SubmitModel = {
  custom_name: string;
  model_name: string;
  author: string;
  version: string;
  description: string;
  custom_note: string | null;
  badges?: string[] | null;
  prompts?: Prompt[] | null;
  dependencies?: Dependency[] | null;
  profiling?: Profiling[] | null;
  benchmarks?: Benchmark[] | null;
}


@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule, ModelCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog {
  search = '';
  filter = 'All';
  filters = ['All', 'LLM', 'Open-source', 'Fast'];
  visible = true;
  showModal = false;
  submittedModelJson = '';
  newModelForm: SubmitModel = {
    custom_name: '',
    model_name: '',
    author: '',
    version: '',
    description: '',
    custom_note: '',
    badges: null,
    prompts: null,
    dependencies: null,
    profiling: null,
    benchmarks: null
  };

  constructor(public modelsService: ModelsService, public theme: ThemeService) {}

  get filtered(): Model[] {
    return this.modelsService.getAll().filter(m =>
      m.name.toLowerCase().includes(this.search.toLowerCase()) &&
      (this.filter === 'All' || m.badges?.includes(this.filter))
    );
  }

  setFilter(f: string) {
    this.visible = false;
    setTimeout(() => { this.filter = f; this.visible = true; }, 200);
  }

  onSearch() {
    this.visible = false;
    setTimeout(() => { this.visible = true; }, 150);
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.newModelForm = {
      custom_name: '',
      model_name: '',
      author: '',
      version: '',
      description: '',
      custom_note: '',
      badges: null,
      prompts: null,
      dependencies: null,
      profiling: null,
      benchmarks: null
    };
  }

  parseArray(value: string): string[] | null {
    const result = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    return result.length ? result : null;
  }

  parseJsonArray<T>(value: string): T[] | null {
    try {
      const parsed = value.trim() ? JSON.parse(value) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  submitModel() {
    // Build SubmitModel payload
    const payload: SubmitModel = {
      custom_name: this.newModelForm.custom_name.trim(),
      model_name: this.newModelForm.model_name.trim(),
      author: this.newModelForm.author.trim(),
      version: this.newModelForm.version.trim(),
      description: this.newModelForm.description.trim(),
      custom_note: (this.newModelForm.custom_note || '').trim() || null,
      badges: this.parseArray((this.newModelForm.badges as any) || '') ,
      prompts: this.parseJsonArray<Prompt>((this.newModelForm.prompts as any) || '') ,
      dependencies: this.parseJsonArray<Dependency>((this.newModelForm.dependencies as any) || ''),
      profiling: this.parseJsonArray<Profiling>((this.newModelForm.profiling as any) || ''),
      benchmarks: this.parseJsonArray<Benchmark>((this.newModelForm.benchmarks as any) || '')
    };

    console.log('SubmitModel payload', payload);
    this.submittedModelJson = JSON.stringify(payload, null, 2);

    const localModel: Model = {
      id: Date.now(),
      name: payload.custom_name || payload.model_name,
      uniq_name: payload.model_name,
      description: payload.description || '',
      custom_note: payload.custom_note || null,
      badges: payload.badges,
      prompts: payload.prompts ? payload.prompts.map(p => p.content || p.name) : null,
      dependencies: payload.dependencies || null,
      profiling: payload.profiling || null,
      architecture: null,
      benchmarks: payload.benchmarks || null
    };

    this.modelsService.addModel(localModel);
    this.closeModal();
  }
}

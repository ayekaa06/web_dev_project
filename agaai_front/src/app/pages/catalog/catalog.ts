import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { ModelCard } from '../../components/model-card/model-card';

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
  newModelForm = {
    name: '',
    uniq_name: '',
    description: '',
    custom_note: '',
    badges: '',
    prompts: '',
    dependencies: '',
    profiling: '',
    architecture: '',
    benchmarks: ''
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
      name: '',
      uniq_name: '',
      description: '',
      badges: '',
      custom_note: '',
      prompts: '',
      dependencies: '',
      profiling: '',
      architecture: '',
      benchmarks: ''
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
    const model: Model = {
      id: Number(this.newModelForm.id) || Date.now(),
      name: this.newModelForm.name.trim(),
      uniq_name: this.newModelForm.uniq_name.trim(),
      description: this.newModelForm.description.trim(),
      custom_note: this.newModelForm.custom_note.trim() || null,
      badges: this.parseJsonArray(this.newModelForm.badges),
      prompts: this.parseArray(this.newModelForm.prompts),
      dependencies: this.parseJsonArray(this.newModelForm.dependencies),
      profiling: this.parseJsonArray(this.newModelForm.profiling),
      architecture: this.parseArray(this.newModelForm.architecture),
      benchmarks: this.parseJsonArray(this.newModelForm.benchmarks)
    };

    console.log('New model submitted', model);
    this.submittedModelJson = JSON.stringify(model, null, 2);
    this.modelsService.addModel(model);
    this.closeModal();
  }
}

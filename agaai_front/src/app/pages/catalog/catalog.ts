import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { ModelCard } from '../../components/model-card/model-card';
import { AdvancedFilters, Benchmark, Dependency, Profiling, Prompt } from '../../types/ml_model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ModelApiService, SubmitModel } from '../../services/model.service';
import { Subject } from 'rxjs/internal/Subject';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { startWith } from 'rxjs/internal/operators/startWith';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule, ModelCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  search = signal('');
  refresh$ = new Subject<void>();
  modelService = inject(ModelApiService);
  appliedQueryParams = signal<Record<string, string>>({});
  models = toSignal(
    this.refresh$.pipe(
      startWith(null), // load immediately on init
      switchMap(() => this.modelService.getAllModels(this.appliedQueryParams())),
    ),
    { initialValue: [] },
  );
  filter = signal('All');
  filters = ['All', 'LLM', 'Open-source', 'Fast'];
  visible = true;
  showModal = false;
  newModelForm: SubmitModel = {
    custom_name: '',
    model_name: '',
    author: '',
    version: '',
    description: '',
    custom_note: '',
    badges: null,
    prompts: [],
    dependencies: [],
    profiling: [],
    benchmarks: [],
  };
  submittedModelJson = '';

  constructor(
    public modelsService: ModelsService,
    public theme: ThemeService,
  ) {}

  // get filtered(): Model[] {
  //   console.log(this.models())
  //   return this.modelsService.getAll().filter(m =>
  //     m.name.toLowerCase().includes(this.search.toLowerCase()) &&
  //     (this.filter === 'All' || m.badges?.includes(this.filter))
  //   );
  // }

  filtered = computed(() => {
    console.log('Filtering models with search:', this.search, 'and filter:', this.filter());
    if (!this.models()) return [];
    this.visible = true;
    return this.models()!.filter(
      (m) =>{
        console.log(m)
        return m.custom_name.toLowerCase().includes(this.search().toLowerCase()) &&
        (this.filter() === 'All' || m.badges?.map((b) => b.name).includes(this.filter()))

      },
    );
  });

  setFilter(f: string) {
    // this.visible = false;
    this.filter.set(f);
    // this.visible = true;
    // setTimeout(() => {
    //   // this.filter = f;
    //   this.visible = true;
    // }, 200);
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
      prompts: [],
      dependencies: [],
      profiling: [],
      benchmarks: [],
    };
  }

  parseArray(value: string): string[] | null {
    const result = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return result.length ? result : [];
  }

  parseJsonArray<T>(value: string): T[] | null {
    try {
      const parsed = value.trim() ? JSON.parse(value) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // helpers for dynamic lists in the form
  addPrompt() {
    if (!this.newModelForm.prompts) this.newModelForm.prompts = [];
    this.newModelForm.prompts.push({ name: '', prompt_template: '' });
  }

  removePrompt(item: Prompt) {
    if (!this.newModelForm.prompts) return;
    const idx = this.newModelForm.prompts.indexOf(item);
    if (idx >= 0) this.newModelForm.prompts.splice(idx, 1);
  }

  addDependency() {
    if (!this.newModelForm.dependencies) this.newModelForm.dependencies = [];
    this.newModelForm.dependencies.push({ name: '', requirement: '' });
  }

  removeDependency(item: Dependency) {
    if (!this.newModelForm.dependencies) return;
    const idx = this.newModelForm.dependencies.indexOf(item);
    if (idx >= 0) this.newModelForm.dependencies.splice(idx, 1);
  }

  addBenchmark() {
    if (!this.newModelForm.benchmarks) this.newModelForm.benchmarks = [];
    this.newModelForm.benchmarks.push({ name: '', description: '', value: 0 });
  }

  removeBenchmark(item: Benchmark) {
    if (!this.newModelForm.benchmarks) return;
    const idx = this.newModelForm.benchmarks.indexOf(item);
    if (idx >= 0) this.newModelForm.benchmarks.splice(idx, 1);
  }

  addProfiling() {
    if (!this.newModelForm.profiling) this.newModelForm.profiling = [];
    this.newModelForm.profiling.push({ name: '', description: '', value: 0 } as any);
  }

  removeProfiling(item: Profiling) {
    if (!this.newModelForm.profiling) return;
    const idx = this.newModelForm.profiling.indexOf(item);
    if (idx >= 0) this.newModelForm.profiling.splice(idx, 1);
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
      badges: this.parseArray((this.newModelForm.badges as any) || '') || [],
      prompts:
        this.newModelForm.prompts && this.newModelForm.prompts.length
          ? this.newModelForm.prompts
          : null,
      dependencies:
        this.newModelForm.dependencies && this.newModelForm.dependencies.length
          ? this.newModelForm.dependencies
          : [],
      profiling:
        this.newModelForm.profiling && this.newModelForm.profiling.length
          ? this.newModelForm.profiling
          : [],
      benchmarks:
        this.newModelForm.benchmarks && this.newModelForm.benchmarks.length
          ? this.newModelForm.benchmarks
          : null,
    };
    this.modelService.addModelRecord(payload).subscribe({
      next: () => {
        this.refresh$.next(); // ← triggers new getAllModels() call, signal updates automatically
        this.closeModal();
      },
    });
    console.log('SubmitModel payload', payload);
    this.closeModal();
  }

  showAdvancedSearch = false;

  advancedFilters: AdvancedFilters = {
    search: '',
    author: '',
    version: '',
    model_name: '',
    badge: '',
    dependencies_has_key: '',
    dependencies_not_has_key: '',
    updated_after: '',
    updated_before: '',
    is_quantized: '',
    param_count_gt: '',
    param_count_lt: '',
    benchmark_name: '',
    benchmark_score_gt: '',
    benchmark_score_lt: '',
    ordering: '',
  };

  openAdvancedSearch() {
    this.showAdvancedSearch = true;
  }

  closeAdvancedSearch() {
    this.showAdvancedSearch = false;
  }

  applyAdvancedSearch() {
    const params: Record<string, string> = {};

    Object.entries(this.advancedFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params[key] = String(value).trim();
      }
    });

    this.appliedQueryParams.set(params);
    this.refresh$.next();
    this.closeAdvancedSearch();
  }

  resetAdvancedSearch() {
    (Object.keys(this.advancedFilters) as Array<keyof AdvancedFilters>).forEach((key) => {
      this.advancedFilters[key] = '';
    });

    this.appliedQueryParams.set({});
    this.refresh$.next();
  }
}

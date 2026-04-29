import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme';
import { ModelApiService } from '../../services/model.service';
import { MLModel, UseCase, UseCaseInput } from '../../types/ml_model';
import { take } from 'rxjs';

type ModelMeta = {
  recordId: number | null;
  customName: string;
  author: string;
  modelName: string;
  version: string;
};

@Component({
  selector: 'app-use-cases-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './use-cases-page.html',
  styleUrl: './use-cases-page.css',
})
export class UseCasesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private modelApi = inject(ModelApiService);
  public theme = inject(ThemeService);

  modelId = Number(this.route.snapshot.paramMap.get('modelId'));
  loading = signal(true);
  useCases = signal<UseCase[]>([]);
  modelDetails = signal<MLModel | null>(null);
  modelMeta = signal<ModelMeta>({
    recordId: null,
    customName: '',
    author: '',
    modelName: '',
    version: '',
  });
  useCaseFormExpanded = signal(true);
  useCaseForm = {
    sphere: '',
    tags: '',
    is_model_modified: false,
    description: '',
    datasets: '',
  };

  modelSummary = computed(() => this.modelDetails() || this.useCases()[0]?.model_fullref || null);
  heroTitle = computed(() => {
    const meta = this.modelMeta();
    const summary = this.modelSummary();
    if (meta.customName) return meta.customName;
    if (summary) return summary.model_name;
    return `Model #${this.modelId}`;
  });
  heroSubtitle = computed(() => {
    const meta = this.modelMeta();
    const summary = this.modelSummary();
    if (summary) {
      return `${summary.author} / ${summary.model_name}:${summary.version}`;
    }
    const parts = [meta.author, meta.modelName, meta.version].filter(Boolean);
    return parts.length ? parts.join(' / ') : 'Use cases for this model';
  });
  backLink = computed(() => {
    const recordId = this.modelMeta().recordId;
    return recordId ? ['/models', recordId] : ['/catalog'];
  });

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const recordId = query.get('record_id');
    const parsedRecordId = recordId ? Number(recordId) : null;

    this.modelMeta.set({
      recordId: parsedRecordId !== null && !Number.isNaN(parsedRecordId) ? parsedRecordId : null,
      customName: query.get('custom_name') || '',
      author: query.get('author') || '',
      modelName: query.get('model_name') || '',
      version: query.get('version') || '',
    });

    this.loadModelDetails();
    this.loadUseCases();
  }

  loadModelDetails() {
    const request = this.modelApi.getModelById(this.modelId);
    if (!request) return;

    request.pipe(take(1)).subscribe({
      next: (model) => {
        this.modelDetails.set(model);
        this.modelMeta.update((current) => ({
          ...current,
          author: current.author || model.author,
          modelName: current.modelName || model.model_name,
          version: current.version || model.version,
        }));
      },
    });
  }

  loadUseCases() {
    this.loading.set(true);
    this.modelApi.getModelUseCases(this.modelId, { ordering: '-created_at' }).subscribe({
      next: (useCases) => {
        this.useCases.set(useCases);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleUseCaseForm() {
    this.useCaseFormExpanded.update((value) => !value);
  }

  private splitList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  submitUseCase() {
    const payload: UseCaseInput = {
      sphere: this.useCaseForm.sphere.trim(),
      tags: this.splitList(this.useCaseForm.tags),
      is_model_modified: this.useCaseForm.is_model_modified,
      description: this.useCaseForm.description.trim(),
      datasets: this.splitList(this.useCaseForm.datasets),
    };

    this.modelApi.addModelUseCase(this.modelId, payload).subscribe({
      next: () => {
        this.useCaseForm = {
          sphere: '',
          tags: '',
          is_model_modified: false,
          description: '',
          datasets: '',
        };
        this.loadUseCases();
      },
    });
  }
}

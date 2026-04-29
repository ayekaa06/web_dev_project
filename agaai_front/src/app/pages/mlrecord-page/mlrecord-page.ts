import { Component, computed, DestroyRef, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Model } from '../../types/ml_model';
import { UseCase, UserReview, UserReviewInput } from '../../types/ml_model';
import { ThemeService } from '../../services/theme';
import { CustomNoteEditor } from '../../components/custom-note-editor/custom-note-editor';
import { ArchitectureViewer } from '../../components/architecture-viewer/architecture-viewer';
import { ProfilingEditor } from '../../components/profiling-editor/profiling-editor';
import { BenchmarkEditor } from '../../components/benchmark-editor/benchmark-editor';
import { PromptsEditor } from '../../components/prompts-editor/prompts-editor';
import { BadgesEditor } from '../../components/badges-editor/badges-editor';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { showToast } from '../../components/toast/toast';
import { take } from 'rxjs';
import { ModelApiService } from '../../services/model.service';
import { environment } from '../../../environment';

type MissingAttribute = {
  key: string;
  label: string;
  buttonText: string;
};

@Component({
  selector: 'app-mlrecord-page',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CustomNoteEditor,
    ArchitectureViewer,
    ProfilingEditor,
    BenchmarkEditor,
    PromptsEditor,
    BadgesEditor,
  ],
  templateUrl: './mlrecord-page.html',
  styleUrl: './mlrecord-page.css',
})
export class MLRecordlPage implements OnInit {
  private destroyRef = inject(DestroyRef);

  route = inject(ActivatedRoute);
  private router = inject(Router);
  private modelId = Number(this.route.snapshot.paramMap.get('id'));
  modelApi = inject(ModelApiService);

  model = signal<Model | null>(null);
  useCases = signal<UseCase[]>([]);
  userReviews = signal<UserReview[]>([]);
  reviewsExpanded = signal(true);
  reviewFormExpanded = signal(true);
  reviewsLoading = signal(false);
  reviewPage = signal(1);
  reviewCount = signal(0);
  reviewPageSize = 5;
  note = '';
  descriptionEdit = signal('');
  dependenciesEdit = signal<any[]>([]);
  userReviewForm = {
    review_text: '',
    rank: 5,
  };
  craftedUniqueName = computed(() => {
    return `${this.model()?.model_fullref.author}/${this.model()?.model_fullref.model_name}/${this.model()?.model_fullref.version}`
  })
  previewUseCases = computed(() => this.useCases().slice(0, 2));
  totalReviewPages = computed(() => Math.max(1, Math.ceil(this.reviewCount() / this.reviewPageSize)));
  hasReviewPagination = computed(() => this.reviewCount() > this.reviewPageSize);
  useCasesPageLink = computed(() => {
    const model = this.model();
    if (!model) return ['/catalog'];
    return ['/models', model.model_fullref.id, 'use-cases'];
  });
  useCasesPageQueryParams = computed(() => {
    const model = this.model();
    if (!model) return {};
    return {
      record_id: String(model.record_id),
      custom_name: model.custom_name,
      author: model.model_fullref.author,
      model_name: model.model_fullref.model_name,
      version: model.model_fullref.version,
    };
  });

  missingAttributes = computed<MissingAttribute[]>(() => {
    const model = this.model();
    if (!model) return [];

    const result: MissingAttribute[] = [];

    if (!model.custom_note) {
      result.push({
        key: 'custom_note',
        label: 'CustomNote',
        buttonText: '+ Custom Note',
      });
    }

    if (!model.architecture || model.architecture.length === 0) {
      result.push({
        key: 'architecture',
        label: 'Architecture',
        buttonText: '+ Architecture',
      });
    }

    if (!model.profiling || model.profiling.length === 0) {
      result.push({
        key: 'profiling',
        label: 'Profiling',
        buttonText: '+ Profiling Data',
      });
    }

    if (!model.benchmarks || model.benchmarks.length === 0) {
      result.push({
        key: 'benchmarks',
        label: 'Benchmarks',
        buttonText: '+ Benchmarks',
      });
    }

    console.log(model.prompts);
    if (!model.prompts || model.prompts.length === 0) {
      result.push({
        key: 'prompts',
        label: 'Prompts',
        buttonText: '+ Prompts',
      });
    }

    if (!model.badges || model.badges.length === 0) {
      result.push({
        key: 'badges',
        label: 'Badges',
        buttonText: '+ Badges',
      });
    }

    return result;
  });
  showEditor = signal<Record<string, boolean>>({});

  constructor(public theme: ThemeService) {
  }

  ngOnInit() {
    // const id = Number(this.route.snapshot.paramMap.get('id'));
    // this.model.set(this.modelsService.getById(id) || null);
    // this.note = localStorage.getItem('note_' + id) || '';
    this.modelApi.getById(this.modelId)?.pipe(take(1)).subscribe((model) => {
      console.log("Model received by subscribing:", model)
      this.model.set(model);
      this.loadRelatedCollections(model.model_fullref.id);
    });
    console.log('Model loaded:', this.model());
  }

  confirmDeleteRecord() {
    const model = this.model();
    if (!model) return;

    const label = model.custom_name || model.model_fullref.model_name;
    const confirmed = window.confirm(
      `Delete "${label}"? This will permanently remove the ML record and its related data.`,
    );

    if (!confirmed) {
      return;
    }

    this.deleteRecord();
  }

  private deleteRecord() {
    const recordId = this.model()?.record_id;
    if (!recordId) return;

    const request = this.modelApi.deleteModelRecord(recordId);
    if (!request) return;

    request.pipe(take(1)).subscribe({
      next: () => {
        showToast('Model record deleted', 'success');
        this.router.navigate(['/catalog']);
      },
    });
  }

  loadRelatedCollections(modelFullrefId: number) {
    this.modelApi.getModelUseCases(modelFullrefId, { ordering: '-created_at' }).pipe(take(1)).subscribe((useCases) => {
      this.useCases.set(useCases);
    });

    this.loadUserReviews(modelFullrefId, 1);
  }

  loadUserReviews(modelFullrefId: number, page = 1) {
    this.reviewsLoading.set(true);
    const params = {
      ordering: '-created_at',
      page: String(page),
      page_size: String(this.reviewPageSize),
    };

    this.modelApi.getModelUserReviews(modelFullrefId, params).pipe(take(1)).subscribe({
      next: (response) => {
        this.userReviews.set(response.results);
        this.reviewCount.set(response.count);
        this.reviewPage.set(page);
        this.reviewsLoading.set(false);
      },
      error: () => {
        this.reviewsLoading.set(false);
      },
    });
  }

  submitUserReview() {
    const model = this.model();
    if (!model) return;

    const modelFullrefId = model.model_fullref.id;
    const payload: UserReviewInput = {
      review_text: this.userReviewForm.review_text.trim(),
      rank: Number(this.userReviewForm.rank) || 3,
    };

    this.modelApi.addModelUserReview(modelFullrefId, payload).pipe(take(1)).subscribe({
      next: () => {
        this.userReviewForm = { review_text: '', rank: 5 };
        this.loadUserReviews(modelFullrefId, 1);
      },
    });
  }

  toggleReviewsView() {
    this.reviewsExpanded.update((value) => !value);
  }

  toggleReviewForm() {
    this.reviewFormExpanded.update((value) => !value);
  }

  goToReviewPage(page: number) {
    const model = this.model();
    if (!model) return;

    const clampedPage = Math.min(Math.max(1, page), this.totalReviewPages());
    this.loadUserReviews(model.model_fullref.id, clampedPage);
  }

  addAttribute(key: string) {
    this.showEditor.set({ ...this.showEditor(), [key]: true });
  }

  openDescriptionEditor() {
    this.descriptionEdit.set(this.model()?.description || '');
    this.showEditor.set({ ...this.showEditor(), description: true });
  }

  saveDescription() {
    const val = this.descriptionEdit();
    this.onAttributeSaved({ property: 'description', value: val });
    this.showEditor.set({ ...this.showEditor(), description: false });
  }

  openDependenciesEditor() {
    const deps = this.model()?.dependencies || [];
    // clone to avoid binding directly to model object
    this.dependenciesEdit.set(deps.map((d: any) => ({ ...d })));
    this.showEditor.set({ ...this.showEditor(), dependencies: true });
  }

  saveDependencies() {
    const parsed = this.dependenciesEdit() || [];
    // basic validation: ensure each dependency has a name
    for (const d of parsed) {
      if (!d.name || d.name.trim() === '') {
        showToast('Each dependency requires a name', 'error');
        return;
      }
    }
    this.onAttributeSaved({ property: 'dependencies', value: parsed });
    this.showEditor.set({ ...this.showEditor(), dependencies: false });
  }

  updateDependencyField(index: number, field: string, value: any) {
    // const arr = [...this.dependenciesEdit()];
    // if (!arr[index]) return;
    // arr[index] = { ...arr[index], [field]: value };
    // this.dependenciesEdit.set(arr);
    this.dependenciesEdit.update(arr =>
    arr.map((item, i) => i === index ? { ...item, [field]: value } : item)
  );
  }

  addDependency() {
    const arr = [...this.dependenciesEdit(), { name: Date.now().toString(), requirement: '', url: '' }];
    this.dependenciesEdit.set(arr);
  }

  removeDependency(index: number) {
    const arr = [...this.dependenciesEdit()];
    arr.splice(index, 1);
    this.dependenciesEdit.set(arr);
  }

  onAttributeSaved(payload: { property: string; value: any }) {
    // this.model.update((m) => ({ ...m!, [payload.property]: payload.value }));
    console.log("MOdel saved", this.model())
    this.modelApi.updateModelRecord(this.model()?.record_id, { [payload.property]: payload.value })?.pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(
      (updatedModel) => {
        console.log('Model updated successfully:', updatedModel);
        this.model.set(structuredClone(updatedModel));
      }
    );
    this.showEditor.set({ ...this.showEditor(), [payload.property]: false });
  }

  onNestedUpdate(payload: { property: string; operation: 'add' | 'remove'; value: any }) {
    console.log(`Updating property ${payload.property} with value:`, payload.value);
    this.modelApi.updateRecordItem(this.model()?.record_id!, payload.value, payload.operation, payload.property)?.pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(
      (updatedItems) => {
        console.log(`Items updated successfully for ${payload.property}:`, updatedItems);
        this.model.set({ ...this.model()!, [payload.property]: updatedItems });
        });
    this.showEditor.set({ ...this.showEditor(), [payload.property]: false });
  }

  onArchitectureFileSelected(file: File) {
    if (!this.model()?.record_id) return;
    const filename = file.name;
    this.modelApi.uploadArchitecture(this.model()?.record_id, filename, file)?.pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((res) => {
      // backend returns { id, file }
      console.log(res)
      const filePath = res?.file.includes('http') ? res.file : `${environment.apiUrl}${res?.file}`;
      if (filePath) {
        this.model.update((m) => {
          if (!m) return m;
          const resultObjectFile = { file: filePath, id: res?.id, description: res?.description };
          const arch = m.architecture ? [...m.architecture, resultObjectFile] : [resultObjectFile];
          return { ...m, architecture: arch };
        });
      }
    });
  }

  onArchitectureFileDeleted(fileId: number | string) {
    const recordId = this.model()?.record_id;
    if (!recordId) return;
    this.modelApi.deleteArchitecture(recordId, fileId)?.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res) => {
      // remove file from model.architecture by id or file path
      this.model.update((m) => {
        if (!m || !m.architecture) return m;
        const remaining = m.architecture.filter((a) => {
          if (typeof fileId === 'number') {
            return a.id !== fileId;
          }else if(typeof fileId === 'string'){
            return a.file !== fileId;
          }
          return true;
        });
        return { ...m, architecture: remaining };
      });
    });
  }

  onArchitectureJsonUploaded(res: any) {
    // backend returns { id, file }
    if (!res) return;
    const filePath = res?.file?.includes('http') ? res.file : `${environment.apiUrl}${res?.file}`;
    if (filePath) {
      this.model.update((m) => {
        if (!m) return m;
        const resultObjectFile = { file: filePath, id: res?.id, description: res?.description };
        const arch = m.architecture ? [...m.architecture, resultObjectFile] : [resultObjectFile];
        return { ...m, architecture: arch };
      });
    }
  }

  isEditorOpen(key: string) {
    return this.showEditor()[key];
  }

  parseSources(){
    return
  }

  getExperience(){
    return
  }
}

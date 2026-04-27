import { Component, computed, DestroyRef, effect, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Model } from '../../types/ml_model';
import { ThemeService } from '../../services/theme';
import { CustomNoteEditor } from '../../components/custom-note-editor/custom-note-editor';
import { ArchitectureViewer } from '../../components/architecture-viewer/architecture-viewer';
import { ProfilingEditor } from '../../components/profiling-editor/profiling-editor';
import { BenchmarkEditor } from '../../components/benchmark-editor/benchmark-editor';
import { PromptsEditor } from '../../components/prompts-editor/prompts-editor';
import { BadgesEditor } from '../../components/badges-editor/badges-editor';
import { inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, filter, take } from 'rxjs';
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
  private modelId = Number(this.route.snapshot.paramMap.get('id'));
  modelApi = inject(ModelApiService);

  model = signal<Model | null>(null);
  note = '';

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
      this.model.set(model);
    });
    console.log('Model loaded:', this.model());
  }

  addAttribute(key: string) {
    this.showEditor.set({ ...this.showEditor(), [key]: true });
  }

  onAttributeSaved(payload: { property: string; value: any }) {
    // this.model.update((m) => ({ ...m!, [payload.property]: payload.value }));
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

  isEditorOpen(key: string) {
    return this.showEditor()[key];
  }
}

import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelsService} from '../../services/models';
import { Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { showToast } from '../../components/toast/toast';
import { CustomNoteEditor } from '../../components/custom-note-editor/custom-note-editor';
import { ArchitectureViewer } from '../../components/architecture-viewer/architecture-viewer';
import { ProfilingEditor } from '../../components/profiling-editor/profiling-editor';
import { BenchmarkEditor } from '../../components/benchmark-editor/benchmark-editor';
import { PromptsEditor } from '../../components/prompts-editor/prompts-editor';
import { BadgesEditor } from '../../components/badges-editor/badges-editor';

type MissingAttribute = {
  key: string;
  label: string;
  buttonText: string;
};


@Component({
  selector: 'app-model-page',
  imports: [CommonModule, RouterLink, FormsModule, CustomNoteEditor, ArchitectureViewer, ProfilingEditor, BenchmarkEditor, PromptsEditor, BadgesEditor],
  templateUrl: './model-page.html',
  styleUrl: './model-page.css'
})
export class ModelPage implements OnInit {
  model = signal<Model | null>(null);
  saved = false;
  note = '';
  missingAttributes = computed<MissingAttribute[]>(() => {
      const model = this.model();
      if (!model) return [];

      const result: MissingAttribute[] = [];

      if (!model.custom_note) {
        result.push({
          key: 'custom_note',
          label: 'CustomNote',
          buttonText: '+ Custom Note'
        });
      }

      if (!model.architecture || model.architecture.length === 0) {
        result.push({
          key: 'architecture',
          label: 'Architecture',
          buttonText: '+ Architecture'
        });
      }

      if (!model.profiling || model.profiling.length === 0) {
        result.push({
          key: 'profiling',
          label: 'Profiling',
          buttonText: '+ Profiling Data'
        });
      }

      if (!model.benchmarks || model.benchmarks.length === 0) {
        result.push({
          key: 'benchmarks',
          label: 'Benchmarks',
          buttonText: '+ Benchmarks'
        });
      }
      
      console.log(model.prompts)
      if (!model.prompts || model.prompts.length === 0) {
        result.push({
          key: 'prompts',
          label: 'Prompts',
          buttonText: '+ Prompts'
        });
      }

      if (!model.badges || model.badges.length === 0) {
        result.push({
          key: 'badges',
          label: 'Badges',
          buttonText: '+ Badges'
        });
      }

      return result;
  });
  showEditor = signal<Record<string, boolean>>({});

  constructor(
    private route: ActivatedRoute,
    private modelsService: ModelsService,
    public theme: ThemeService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.model.set(this.modelsService.getById(id) || null);
    this.saved = this.modelsService.isSaved(id);
    this.note = localStorage.getItem('note_' + id) || '';
  }

  toggleSave() {
    if (!this.model()) return;
    this.saved = this.modelsService.toggleSave(this.model()!.id);
    showToast(this.saved ? 'Добавлено в избранное!' : 'Удалено из избранного');
  }

  addAttribute(key: string) {
    this.showEditor.set({ ...this.showEditor(), [key]: true });
  }

  onAttributeSaved(payload: { property: string; value: any }) {
    this.model.update(m => ({ ...m!, [payload.property]: payload.value }));
    this.showEditor.set({ ...this.showEditor(), [payload.property]: false });
  }

  isEditorOpen(key: string) {
    return this.showEditor()[key];
  }
}

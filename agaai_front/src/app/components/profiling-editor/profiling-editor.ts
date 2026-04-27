import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';
import { Profiling } from '../../types/ml_model';

@Component({
  selector: 'app-profiling-editor',
  imports: [FormsModule, CommonModule],
  templateUrl: './profiling-editor.html',
  styleUrl: './profiling-editor.css'
})
export class ProfilingEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();

  // allow typing metric name instead of selecting
  metric: string = '';
  value: number | null = null;

  save() {
    if (!this.model) return;
    const entry: Profiling = { name: this.metric.trim(), description: '', value: this.value != null ? String(this.value) : null };
    const newProfiling = [...(this.model.profiling || []), entry];
    showToast('Profiling metric saved');
    this.saved.emit({ property: 'profiling', value: newProfiling });
  }
}

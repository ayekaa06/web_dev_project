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

  metrics = ['Latency', 'Memory', 'Throughput'];
  metric = this.metrics[0];
  value: string | null = null;

  save() {
    if (!this.model) return;
    const entry: Profiling = { name: this.metric, description: '', value: String(this.value) || null };
    const newProfiling = [...(this.model.profiling || []), entry];
    showToast('Profiling metric saved');
    this.saved.emit({ property: 'profiling', value: newProfiling });
  }
}

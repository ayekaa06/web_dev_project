import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';
import { Benchmark } from '../../types/ml_model';

@Component({
  selector: 'app-benchmark-editor',
  imports: [FormsModule, CommonModule],
  templateUrl: './benchmark-editor.html',
  styleUrl: './benchmark-editor.css'
})
export class BenchmarkEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();

  benchmarks = ['MMLU', 'Accuracy', 'BLEU', 'ROUGE'];
  benchmark = this.benchmarks[0];
  value: number | null = null;

  save() {
    if (!this.model) return;
    const entry: Benchmark = { name: this.benchmark, description: '', value: Number(this.value) || 0 };
    const newBenchmarks = [...(this.model.benchmarks || []), entry];
    showToast('Benchmark saved');
    this.saved.emit({ property: 'benchmarks', value: newBenchmarks });
  }
}

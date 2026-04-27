import { Component, EventEmitter, Output, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';
import { Benchmark } from '../../types/ml_model';
import { ModelApiService } from '../../services/model.service';

@Component({
  selector: 'app-benchmark-editor',
  imports: [FormsModule, CommonModule],
  templateUrl: './benchmark-editor.html',
  styleUrl: './benchmark-editor.css'
})
export class BenchmarkEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();
  @Output() nestedUpdate = new EventEmitter<{ property: string; operation: 'add' | 'remove'; value: any }>();

  modelService = inject(ModelApiService);

  benchmarks = signal<Benchmark[] | null>([]);
  benchmark: Benchmark = { name: '', description: '', value: 0 };
  value: number | null = 0;
  // selected existing parsed benchmark name (or null)
  selectedSuggestionName: string | null = null;

  save() {
    if (!this.model) return;
    const name = this.selectedSuggestionName || this.benchmark.name.trim();
    if (!name) return showToast('Benchmark name required', 'error');

    const existing = (this.model.benchmarks || []).find((b) => b.name === name);
    if (existing) {
      return showToast('Benchmark already present', 'error');
    }

    const entry: Benchmark = { name, description: this.benchmark.description, value: Number(this.value) || this.benchmark.value || 0 };
    showToast('Benchmark added', 'success');
    this.nestedUpdate.emit({ property: 'benchmarks', operation: 'add', value: { benchmark_name: entry.name, value: entry.value } });
    // clear inputs
    this.benchmark = { name: '', description: '', value: 0 };
    this.value = 0;
    this.selectedSuggestionName = null;
  }

  ngOnInit() {
    this.modelService.getAllRecordItem('benchmarks')?.subscribe((benchmarks) => {
      console.log('Fetched benchmarks:', benchmarks);
      this.benchmarks.set(benchmarks as Benchmark[]);
    });
  }

  remove(idx: number) {
    if (!this.model) return;
    const removed = (this.model.benchmarks || [])[idx];
    showToast('Benchmark removed');
    const payload = { benchmark_name: removed.name };
    this.nestedUpdate.emit({ property: 'benchmarks', operation: 'remove', value: payload });
  }

  onSelectExisting(name: string | null) {
    if (!name) {
      this.selectedSuggestionName = null;
      this.benchmark = { name: '', description: '', value: 0 };
      this.value = null;
      return;
    }
    const list = this.benchmarks() || [];
    const found = list.find((b) => b.name === name);
    if (found) {
      this.benchmark = { ...found };
      this.value = found.value || null;
      this.selectedSuggestionName = found.name;
    }
  }

  // editing existing entries is not supported in this component
}

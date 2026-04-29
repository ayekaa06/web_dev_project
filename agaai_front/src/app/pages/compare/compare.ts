import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { ModelApiService } from '../../services/model.service';
import { ThemeService } from '../../services/theme';
import { Model } from '../../services/models';

type ProfilingState = 'high' | 'low' | 'neutral' | 'missing';

@Component({
  selector: 'app-compare',
  imports: [CommonModule, RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.css',
})
export class Compare implements OnInit {
  private modelApi = inject(ModelApiService);
  public theme = inject(ThemeService);

  loading = signal(true);
  records = signal<Model[]>([]);
  selectedIds = signal<number[]>([]);

  selectedRecords = computed(() => {
    const selected = new Set(this.selectedIds());
    return this.records().filter((record) => selected.has(record.record_id));
  });

  compareGridTemplate = computed(
    () => `repeat(${Math.max(this.selectedRecords().length, 1)}, minmax(0, 1fr))`,
  );

  profilingGridTemplate = computed(
    () => `240px repeat(${Math.max(this.selectedRecords().length, 1)}, minmax(0, 1fr))`,
  );

  benchmarkNames = computed(() =>
    Array.from(
      new Set(
        this.selectedRecords().flatMap((record) => (record.benchmarks ?? []).map((benchmark) => benchmark.name)),
      ),
    ),
  );

  profilingNames = computed(() =>
    Array.from(new Set(this.selectedRecords().flatMap((record) => (record.profiling ?? []).map((item) => item.name)))),
  );

  benchmarkMaxMap = computed(() => {
    const map = new Map<string, number>();
    for (const record of this.selectedRecords()) {
      for (const benchmark of record.benchmarks ?? []) {
        const current = map.get(benchmark.name) ?? Number.NEGATIVE_INFINITY;
        map.set(benchmark.name, Math.max(current, benchmark.value));
      }
    }
    return map;
  });

  profilingRangeMap = computed(() => {
    const map = new Map<string, { min: number; max: number }>();
    for (const record of this.selectedRecords()) {
      for (const item of record.profiling ?? []) {
        const value = this.parseProfilingValue(item.value);
        if (value === null) continue;

        const current = map.get(item.name);
        if (!current) {
          map.set(item.name, { min: value, max: value });
          continue;
        }

        map.set(item.name, {
          min: Math.min(current.min, value),
          max: Math.max(current.max, value),
        });
      }
    }
    return map;
  });

  canSelectMore = computed(() => this.selectedIds().length < 3);

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);
    this.modelApi
      .getAllModelRecords()
      .pipe(take(1))
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  toggle(record: Model): void {
    const isSelected = this.isSelected(record);
    if (isSelected) {
      this.selectedIds.update((ids) => ids.filter((id) => id !== record.record_id));
      return;
    }

    if (!this.canSelectMore()) {
      return;
    }

    this.selectedIds.update((ids) => [...ids, record.record_id]);
  }

  isSelected(record: Model): boolean {
    return this.selectedIds().includes(record.record_id);
  }

  selectionLabel(record: Model): string {
    return `${record.custom_name} • ${record.model_fullref.model_name}`;
  }

  modelSubtitle(record: Model): string {
    const fullref = record.model_fullref;
    return `${fullref.author} / ${fullref.model_name}:${fullref.version}`;
  }

  averageReviewLabel(record: Model): string {
    if (record.average_review_rank === null || record.average_review_rank === undefined) {
      return 'No reviews';
    }

    return `${record.average_review_rank.toFixed(1)} / 5`;
  }

  benchmarkValue(record: Model, benchmarkName: string): number | null {
    return record.benchmarks?.find((benchmark) => benchmark.name === benchmarkName)?.value ?? null;
  }

  benchmarkFill(record: Model, benchmarkName: string): number {
    const value = this.benchmarkValue(record, benchmarkName);
    const max = this.benchmarkMaxMap().get(benchmarkName);

    if (value === null || !max || max <= 0) {
      return 0;
    }

    return Math.max((value / max) * 100, value > 0 ? 6 : 0);
  }

  benchmarkLabel(record: Model, benchmarkName: string): string {
    const value = this.benchmarkValue(record, benchmarkName);
    return value === null ? '—' : value.toFixed(1);
  }

  profilingValue(record: Model, metricName: string): string | null {
    return record.profiling?.find((item) => item.name === metricName)?.value ?? null;
  }

  profilingState(record: Model, metricName: string): ProfilingState {
    const value = this.parseProfilingValue(this.profilingValue(record, metricName));
    const range = this.profilingRangeMap().get(metricName);

    if (value === null || !range) {
      return 'missing';
    }

    if (range.min === range.max) {
      return 'neutral';
    }

    if (value === range.max) {
      return 'high';
    }

    if (value === range.min) {
      return 'low';
    }

    return 'neutral';
  }

  private parseProfilingValue(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value.trim() === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

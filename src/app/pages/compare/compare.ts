import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-compare',
  imports: [CommonModule, RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.css'
})
export class Compare {
  selected: Model[] = [];
  fields = [
    { label: 'Тип', key: 'type' },
    { label: 'Архитектура', key: 'architecture' },
    { label: 'Бенчмарки', key: 'benchmarks' },
    { label: 'Описание', key: 'description' },
  ];

  constructor(public modelsService: ModelsService, public theme: ThemeService) {}

  get models() { return this.modelsService.getAll(); }

  isSelected(model: Model): boolean {
    return !!this.selected.find(m => m.id === model.id);
  }

  toggle(model: Model) {
    if (this.isSelected(model)) {
      this.selected = this.selected.filter(m => m.id !== model.id);
    } else if (this.selected.length < 3) {
      this.selected = [...this.selected, model];
    }
  }

  getValue(model: Model, key: string): string {
    return (model as any)[key];
  }
}

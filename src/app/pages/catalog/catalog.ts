import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { ModelCard } from '../../components/model-card/model-card';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule, ModelCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog {
  search = '';
  filter = 'All';
  filters = ['All', 'LLM', 'Open-source', 'Fast'];
  visible = true;

  constructor(public modelsService: ModelsService, public theme: ThemeService) {}

  get filtered(): Model[] {
    return this.modelsService.getAll().filter(m =>
      m.name.toLowerCase().includes(this.search.toLowerCase()) &&
      (this.filter === 'All' || m.type === this.filter)
    );
  }

  setFilter(f: string) {
    this.visible = false;
    setTimeout(() => { this.filter = f; this.visible = true; }, 200);
  }

  onSearch() {
    this.visible = false;
    setTimeout(() => { this.visible = true; }, 150);
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { showToast } from '../toast/toast';

@Component({
  selector: 'app-model-card',
  imports: [RouterLink],
  templateUrl: './model-card.html',
  styleUrl: './model-card.css'
})
export class ModelCard implements OnInit {
  @Input() model!: Model;
  saved = false;

  constructor(private modelsService: ModelsService, public theme: ThemeService) {}

  ngOnInit() {
    this.saved = this.modelsService.isSaved(this.model.id);
  }

  toggleSave(e: Event) {
    e.preventDefault();
    this.saved = this.modelsService.toggleSave(this.model.id);
    showToast(this.saved ? 'Добавлено в избранное!' : 'Удалено из избранного');
  }
}

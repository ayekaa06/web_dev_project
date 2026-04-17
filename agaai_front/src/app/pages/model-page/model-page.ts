import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { showToast } from '../../components/toast/toast';

@Component({
  selector: 'app-model-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './model-page.html',
  styleUrl: './model-page.css'
})
export class ModelPage implements OnInit {
  model: Model | undefined;
  saved = false;
  note = '';

  constructor(
    private route: ActivatedRoute,
    private modelsService: ModelsService,
    public theme: ThemeService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.model = this.modelsService.getById(id);
    this.saved = this.modelsService.isSaved(id);
    this.note = localStorage.getItem('note_' + id) || '';
  }

  toggleSave() {
    if (!this.model) return;
    this.saved = this.modelsService.toggleSave(this.model.id);
    showToast(this.saved ? 'Добавлено в избранное!' : 'Удалено из избранного');
  }

  saveNote() {
    if (!this.model) return;
    localStorage.setItem('note_' + this.model.id, this.note);
    showToast('Заметка сохранена!');
  }
}

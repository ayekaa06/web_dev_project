import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { ModelCard } from '../../components/model-card/model-card';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, RouterLink, ModelCard],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit {
  saved: Model[] = [];

  constructor(private modelsService: ModelsService, public theme: ThemeService) {}

  ngOnInit() {
    this.saved = this.modelsService.getSaved();
  }
}

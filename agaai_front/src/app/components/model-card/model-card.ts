import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModelsService, Model } from '../../services/models';
import { ThemeService } from '../../services/theme';
import { showToast } from '../toast/toast';
import { ListModel } from '../../types/ml_model';

@Component({
  selector: 'app-model-card',
  imports: [RouterLink],
  templateUrl: './model-card.html',
  styleUrl: './model-card.css',
})
export class ModelCard implements OnInit {
  @Input() model!: ListModel;
  constructor(
    private modelsService: ModelsService,
    public theme: ThemeService,
  ) {}
  ngOnInit() {}
}

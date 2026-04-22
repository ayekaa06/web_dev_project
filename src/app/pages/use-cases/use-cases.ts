import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModelsService, Model, UseCase } from '../../services/models';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-use-cases',
  imports: [CommonModule, RouterLink],
  templateUrl: './use-cases.html',
  styleUrl: './use-cases.css'
})
export class UseCases implements OnInit {
  model: Model | undefined;
  likedIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private modelsService: ModelsService,
    public theme: ThemeService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.model = this.modelsService.getById(id);
    this.likedIds = JSON.parse(localStorage.getItem('likedUseCases') || '[]');
  }

  toggleLike(uc: UseCase) {
    if (this.likedIds.includes(uc.id)) {
      this.likedIds = this.likedIds.filter(i => i !== uc.id);
      uc.likes--;
    } else {
      this.likedIds = [...this.likedIds, uc.id];
      uc.likes++;
    }
    localStorage.setItem('likedUseCases', JSON.stringify(this.likedIds));
  }

  isLiked(id: number): boolean {
    return this.likedIds.includes(id);
  }
}

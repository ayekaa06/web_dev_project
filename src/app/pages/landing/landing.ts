import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {
  constructor(public theme: ThemeService) {}

  features = [
    { icon: '🔍', title: 'Поиск и фильтры', desc: 'Найдите модель по типу, архитектуре и характеристикам' },
    { icon: '📊', title: 'Сравнение', desc: 'Сравнивайте до 3 моделей side-by-side' },
    { icon: '❤️', title: 'Избранное', desc: 'Сохраняйте понравившиеся модели' },
    { icon: '📝', title: 'Заметки', desc: 'Пишите личные заметки к каждой модели' },
  ];
}

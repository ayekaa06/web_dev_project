import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Catalog } from './pages/catalog/catalog';
import { ModelPage } from './pages/model-page/model-page';
import { Favorites } from './pages/favorites/favorites';
import { Compare } from './pages/compare/compare';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'catalog', component: Catalog },
  { path: 'models/:id', component: ModelPage },
  { path: 'favorites', component: Favorites },
  { path: 'compare', component: Compare }
];

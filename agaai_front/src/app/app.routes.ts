import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Catalog } from './pages/catalog/catalog';
import { UseCasesPage } from './pages/use-cases-page/use-cases-page';
import { Compare } from './pages/compare/compare';
import { LoginPage } from './pages/login-page/login-page';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs/internal/operators/map';
import { MLRecordlPage } from './pages/mlrecord-page/mlrecord-page';

const authGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService
    .isAuhtenticated()
    .pipe(map((isValid) => isValid || router.createUrlTree(['/login'])));
};

const redirectIfAuthenticated = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  console.log('Checking authentication for route access...', authService.isAuhtenticated());

  return authService
    .isAuhtenticated()
    .pipe(map((isValid) => !isValid || router.createUrlTree(['/'])));
};

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [redirectIfAuthenticated] },
  { path: '', pathMatch: 'full', component: Landing, canActivate: [authGuard] },
  { path: 'catalog', component: Catalog, canActivate: [authGuard] },
  { path: 'models/:id', component: MLRecordlPage, canActivate: [authGuard] },
  { path: 'models/:modelId/use-cases', component: UseCasesPage, canActivate: [authGuard] },
  { path: 'compare', component: Compare, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

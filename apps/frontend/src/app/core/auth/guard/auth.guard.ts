import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

export const authGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorageService);
  const router = inject(Router);

  if (tokens.isAuthenticated()) return true;

  router.navigateByUrl('/login');
  return false;
};

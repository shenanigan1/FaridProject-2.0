import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '@env/environment';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  return next(req.clone({ url: `${apiBaseUrl}${req.url}` }));
};

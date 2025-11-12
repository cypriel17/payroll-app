import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { HttpCacheService } from '../service/http.cache.service';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private httpCache: HttpCacheService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> | Observable<HttpResponse<unknown>> {
    // Skip caching for authentication and verification endpoints
    if (request.url.includes('verify') || request.url.includes('login') || request.url.includes('register')
      || request.url.includes('refresh') || request.url.includes('resetpassword')
      || request.url.includes('new/password')) {
      return next.handle(request);
    }

    // ✅ NEW: Skip caching for paginated requests (holidays, employees, etc.)
    if (request.params.has('page') || request.params.has('size')) {
      console.log('⚠️ Bypassing cache for paginated request:', request.urlWithParams);
      return next.handle(request);
    }

    // Clear cache for non-GET requests and downloads
    if (request.method !== 'GET' || request.url.includes('download')) {
      this.httpCache.evictAll();
      return next.handle(request);
    }

    // ✅ UPDATED: Use urlWithParams to include query parameters in cache key
    const cacheKey = request.urlWithParams;
    const cachedResponse: HttpResponse<any> = this.httpCache.get(cacheKey);

    if (cachedResponse) {
      console.log('✅ Found Response in Cache:', cacheKey);
      this.httpCache.logCache();
      return of(cachedResponse);
    }

    console.log('⚠️ Not in cache, making request:', cacheKey);
    return this.handleRequestCache(request, next);
  }

  private handleRequestCache(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        tap(response => {
          if (response instanceof HttpResponse && request.method !== 'DELETE') {
            // ✅ UPDATED: Cache with urlWithParams as key
            const cacheKey = request.urlWithParams;
            console.log('💾 Caching Response:', cacheKey);
            this.httpCache.put(cacheKey, response);
          }
        })
      );
  }
}

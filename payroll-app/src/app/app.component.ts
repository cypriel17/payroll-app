import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, filter, takeUntil } from 'rxjs/operators';
import { UserModel } from './component/profile/user.model';
import { UserService } from './service/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  user$: Observable<UserModel | null>;
  isAuthenticated: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication on initial load
    this.checkAuthentication();

    // Re-check authentication on every route change
    // This will detect when user logs in and navigates to '/'
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkAuthentication();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthentication(): void {
    this.isAuthenticated = this.userService.isAuthenticated();

    if (this.isAuthenticated) {
      this.user$ = this.userService.profile$().pipe(
        map(response => response.data.user),
        catchError(error => {
          console.error('Error loading profile:', error);
          this.isAuthenticated = false;
          // Don't navigate to login if already on a public route
          if (!this.router.url.includes('/login') &&
            !this.router.url.includes('/register') &&
            !this.router.url.includes('/verify')) {
            this.router.navigate(['/login']);
          }
          return of(null);
        })
      );
    } else {
      this.user$ = of(null);
    }
  }
}

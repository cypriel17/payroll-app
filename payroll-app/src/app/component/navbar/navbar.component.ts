import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UserModel } from 'src/app/component/profile/user.model';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  @Input() user: UserModel;

  constructor(
    private router: Router,
    private userService: UserService,
    private notification: NotificationService
  ) {}

  logOut(): void {
    this.userService.logOut();
    this.notification.onDefault('You\'ve been successfully logged out');
    this.router.navigate(['/login']).then(() => {
    });
  }
}

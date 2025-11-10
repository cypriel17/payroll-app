import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavbarComponent } from './navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent
  ],
  imports: [SharedModule],
  exports: [
    NavbarComponent,
    SidebarComponent
  ]
})
export class NavBarModule {}

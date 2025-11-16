import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavbarComponent } from './navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import {NgOptimizedImage} from "@angular/common";

@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent
  ],
  imports: [SharedModule, NgOptimizedImage],
  exports: [
    NavbarComponent,
    SidebarComponent
  ]
})
export class NavBarModule {}

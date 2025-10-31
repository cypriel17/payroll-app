import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './component/home/home/home.component';
import { AuthenticationGuard } from './guard/authentication.guard';

const routes: Routes = [
  { path: 'profile', loadChildren: () => import('./component/profile/user.module').then(module => module.UserModule)},
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: '**', component: HomeComponent, canActivate: [AuthenticationGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

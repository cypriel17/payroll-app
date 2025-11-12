import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './component/home/home/home.component';
import { AuthenticationGuard } from './guard/authentication.guard';
import {AttendanceListComponent} from "./component/attendance/attendance-list/attendance-list.component";
import { AdminLeaveComponent } from "./component/leave/admin-leave/admin-leave.component";
import { EmployeeLeaveComponent } from "./component/leave/employee-leave/employee-leave.component";

const routes: Routes = [
  {
    path: 'profile',
    loadChildren: () => import('./component/profile/user.module').then(module => module.UserModule)
  },
  {
    path: 'employee',
    loadChildren: () => import('./component/employee/employee.module').then(module => module.EmployeeModule),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'holidays',
    loadChildren: () => import('./component/holiday/holiday.module').then(m => m.HolidayModule)
  },
  {
    path: 'attendance',
    component: AttendanceListComponent
  },
  {
    path: 'departments',
    loadChildren: () => import('./component/department/department.module')
      .then(m => m.DepartmentModule)
  },
  {
    path: 'employee/leave',
    component: EmployeeLeaveComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Leave Requests' }
  },
  {
    path: 'admin/leave',
    component: AdminLeaveComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Leave Management' }
  },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: HomeComponent,
    canActivate: [AuthenticationGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

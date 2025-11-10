import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from 'src/app/guard/authentication.guard';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import { EmployeesComponent } from './employees/employees.component';
import { NewemployeeComponent } from './newemployee/newemployee.component';

const employeeRoutes: Routes = [
  { path: 'employees', component: EmployeesComponent, canActivate: [AuthenticationGuard] },
  { path: 'employees/new', component: NewemployeeComponent, canActivate: [AuthenticationGuard] },
  { path: 'employees/:id', component: EmployeeDetailComponent, canActivate: [AuthenticationGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(employeeRoutes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule { }

// expense-claims.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeExpenseClaimsComponent } from './employee/employee-expense-claims.component';
import { AdminExpenseClaimsComponent } from './admin/admin-expense-claims.component';

const routes: Routes = [
  {
    path: 'employee',
    component: EmployeeExpenseClaimsComponent
  },
  {
    path: 'admin',
    component: AdminExpenseClaimsComponent
  },
  {
    path: '',
    redirectTo: 'employee',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    EmployeeExpenseClaimsComponent,
    AdminExpenseClaimsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ExpenseClaimsModule { }

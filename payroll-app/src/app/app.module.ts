import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { AuthModule } from './component/auth/auth.module';
import { CustomerModule } from './component/customer/customer.module';
import { HomeModule } from './component/home/home.module';
import { InvoiceModule } from './component/invoice/invoice.module';
import { EmployeeModule } from './component/employee/employee.module';
import { NotificationModule } from './notification.module';
import { NavBarModule } from './component/navbar/navbar.module';
import { AttendanceListComponent } from './component/attendance/attendance-list/attendance-list.component';
import { EditAttendanceModalComponent } from './component/attendance/edit-attendance-modal/edit-attendance-modal.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {EmployeeLeaveComponent} from "./component/leave/employee-leave/employee-leave.component";
import {AdminLeaveComponent} from "./component/leave/admin-leave/admin-leave.component";


@NgModule({
  declarations: [ AppComponent,
    AttendanceListComponent,
    EditAttendanceModalComponent,
    EmployeeLeaveComponent,
    AdminLeaveComponent
  ],
  imports: [
    BrowserModule,
    CoreModule,
    AuthModule,
    CustomerModule,
    InvoiceModule,
    EmployeeModule,
    HomeModule,
    NavBarModule,
    AppRoutingModule,
    NotificationModule,
    ReactiveFormsModule,
    FormsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

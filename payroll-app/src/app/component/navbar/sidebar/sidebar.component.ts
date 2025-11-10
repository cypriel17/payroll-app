import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UserModel } from 'src/app/component/profile/user.model';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  @Input() user: UserModel;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi-house-door',
      route: '/'
    },
    {
      label: 'Employees',
      icon: 'bi-people-fill',
      expanded: false,
      children: [
        { label: 'Members', icon: 'bi-person-badge', route: '/employee/employees' },
        { label: 'Members Profile', icon: 'bi-person-circle', route: '/employee/employees' },
        { label: 'Holidays', icon: 'bi-calendar-event', route: '/holidays' },
        { label: 'Attendance Employees', icon: 'bi-calendar-check', route: '/attendance/employees' },
        { label: 'Attendance', icon: 'bi-calendar3', route: '/attendance' },
        { label: 'Leave Request', icon: 'bi-calendar-x', route: '/leave' },
        { label: 'Department', icon: 'bi-building', route: '/departments' }
      ]
    },
    {
      label: 'Our Clients',
      icon: 'bi-people',
      children: [
        { label: 'All Clients', icon: 'bi-list-ul', route: '/customers' },
        { label: 'Add New Client', icon: 'bi-person-plus', route: '/customers/new' },
      ]
    },
    {
      label: 'Accounts',
      icon: 'bi-receipt',
      children: [
        { label: 'All Invoices', icon: 'bi-list-ul', route: '/invoices' },
        { label: 'New Invoice', icon: 'bi-file-plus', route: '/invoices/new' },
      ]
    },
    {
      label: 'Payroll',
      icon: 'bi-cash-coin',
      children : [
        { label: 'Employee Salary', icon: 'bi-cash-coin', route: '/payroll/salary' },
      ]
    },
    {
      label: 'Notifications',
      icon: 'bi-bell',
      children: [
        { label: 'Inbox', icon: 'bi-bell', route: '/notifications' },
      ]
    },
    {
      label: 'Help',
      icon: 'bi-question-circle',
      children: [
        { label: 'Contact Support', icon: 'bi-envelope', route: '/help/contact' },
      ]
    }
  ];

  constructor(private router: Router) {}

  toggleMenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}

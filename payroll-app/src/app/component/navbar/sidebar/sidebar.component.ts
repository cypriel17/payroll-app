import { ChangeDetectionStrategy, Component, Input, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() user: UserModel;

  private destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'bi-house-door', route: '/' },
    {
      label: 'Employees', icon: 'bi-people-fill', expanded: false, children: [
        { label: 'Members', icon: 'bi-person-badge', route: '/employee/employees' },
        { label: 'Members Profile', icon: 'bi-person-circle', route: '/employee/employees' },
        { label: 'Holidays', icon: 'bi-calendar-event', route: '/holidays' },
        { label: 'Attendance', icon: 'bi-calendar3', route: '/attendance' },
        { label: 'Department', icon: 'bi-building', route: '/departments' }
      ]
    },
    {
      label: 'Leave Request', icon: 'bi-calendar-x', expanded: false, children: [
        { label: 'My Leave', icon: 'bi-calendar-plus', route: '/employee/leave' },
        { label: 'Manage Leave', icon: 'bi-calendar-check', route: '/admin/leave' }
      ]
    },
    {
      label: 'Our Clients', icon: 'bi-people', children: [
        { label: 'All Clients', icon: 'bi-list-ul', route: '/customers' },
        { label: 'Add New Client', icon: 'bi-person-plus', route: '/customers/new' },
      ]
    },
    {
      label: 'Accounts', icon: 'bi-receipt', children: [
        { label: 'All Invoices', icon: 'bi-list-ul', route: '/invoices' },
        { label: 'New Invoice', icon: 'bi-file-plus', route: '/invoices/new' },
      ]
    },
    {
      label: 'Payroll', icon: 'bi-cash-coin', expanded: false, children: [
        { label: 'Employee Salary', icon: 'bi-cash-coin', route: '/payroll/salary' },
        { label: 'Payslips', icon: 'bi-file-earmark-text', route: '/payroll/payslips' },
        { label: 'Process Payroll', icon: 'bi-calculator', route: '/payroll/process' }
      ]
    },
    {
      label: 'Notifications', icon: 'bi-bell', children: [
        { label: 'Inbox', icon: 'bi-bell', route: '/notifications' },
      ]
    },
    {
      label: 'Help', icon: 'bi-question-circle', children: [
        { label: 'Contact Support', icon: 'bi-envelope', route: '/help/contact' },
      ]
    }
  ];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Expand parents for the initial route and on future navigations
    this.expandActiveParents();

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.expandActiveParents();
        // OnPush: tell Angular to check this component now
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Parent click: toggle expansion if has children; navigate otherwise
  toggleMenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
      this.cdr.markForCheck(); // ensure view updates under OnPush
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onChildClick(event: MouseEvent, item: MenuItem): void {
    event.stopPropagation();
    if (!item.route) {
      // if the child has children (sub-sub menu) toggle it instead
      if (item.children) { this.toggleMenu(item); }
      return;
    }
    this.router.navigate([item.route]).then(() => this.cdr.markForCheck());
  }


  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  private expandActiveParents(): void {
    const currentUrl = this.router.url;

    const expandRecursively = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.children) {
          const hasActiveChild = this.hasActiveChild(item.children, currentUrl);
          item.expanded = hasActiveChild;
          // recurse so grandchildren are handled too
          expandRecursively(item.children);
        }
      }
    };

    expandRecursively(this.menuItems);
  }

  private hasActiveChild(items: MenuItem[], currentUrl: string): boolean {
    return items.some(child =>
      (child.route && currentUrl.startsWith(child.route)) ||
      (child.children && this.hasActiveChild(child.children, currentUrl))
    );
  }
}

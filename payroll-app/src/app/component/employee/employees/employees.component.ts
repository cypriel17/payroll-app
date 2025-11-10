import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, Page } from 'src/app/interface/appstates';
import { Employee } from '../employee.model';
import { State } from 'src/app/interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { EmployeeService } from '../employee.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesComponent implements OnInit {
  employeesState$: Observable<State<CustomHttpResponse<Page<Employee> & UserModel>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<Employee> & UserModel>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  private showLogsSubject = new BehaviorSubject<boolean>(false);
  showLogs$ = this.showLogsSubject.asObservable();
  readonly DataState = DataState;

  constructor(
    private router: Router,
    private employeeService: EmployeeService,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.employeesState$ = this.employeeService.searchEmployees$()
      .pipe(
        map(response => {
          console.log('Full Response:', response);
          console.log('Response Data:', response.data);
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  /**
   * Search employees by name, email, or employee ID
   */
  searchEmployees(searchForm: NgForm): void {
    this.currentPageSubject.next(0);
    this.employeesState$ = this.employeeService.searchEmployees$(searchForm.value.name)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  /**
   * Go to specific page
   */
  goToPage(pageNumber?: number, name?: string): void {
    this.employeesState$ = this.employeeService.searchEmployees$(name, pageNumber)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          this.dataSubject.next(response);
          this.currentPageSubject.next(pageNumber);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
        })
      );
  }

  /**
   * Navigate to next or previous page
   */
  goToNextOrPreviousPage(direction?: string, name?: string): void {
    this.goToPage(
      direction === 'forward' ? this.currentPageSubject.value + 1 : this.currentPageSubject.value - 1,
      name
    );
  }

  /**
   * Navigate to employee detail page
   */
  selectEmployee(employee: Employee): void {
    this.router.navigate([`/employees/${employee.id}`]);
  }

  getEmployees(state: any): Employee[] {
    if (!state?.appData?.data?.page) {
      return [];
    }

    const page = state.appData.data.page;

    // Check if page has content property (Spring Page object)
    if (page.content && Array.isArray(page.content)) {
      return page.content;
    }

    // Fallback if page is directly an array
    if (Array.isArray(page)) {
      return page;
    }

    return [];
  }

  /**
   * Navigate to new employee form
   */
  addNewEmployee(): void {
    this.router.navigate(['/employees/new']);
  }

  /**
   * Get employee initials for avatar
   */
  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  /**
   * Get total pages for pagination
   */
  getTotalPages(state: any): number {
    return state?.appData?.data?.page?.totalPages || 0;
  }

  /**
   * Check if there are employees
   */
  hasEmployees(state: any): boolean {
    return this.getEmployees(state).length > 0;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { EmployeeService } from '../employee.service';
// import { Employee } from '../employee.model';
//
// @Component({
//   selector: 'app-employees',
//   templateUrl: './employees.component.html',
//   styleUrls: ['./employees.component.css']
// })
// export class EmployeesComponent implements OnInit {
//   employees: Employee[] = [];
//   filteredEmployees: Employee[] = [];
//   loading: boolean = false;
//   error: string = '';
//   searchTerm: string = '';
//
//   // Pagination
//   currentPage: number = 0;
//   totalPages: number = 0;
//   totalElements: number = 0;
//   pageSize: number = 10;
//
//   constructor(
//     private employeeService: EmployeeService,
//     private router: Router
//   ) { }
//
//   ngOnInit(): void {
//     this.loadEmployees();
//   }
//
//   /**
//    * Load employees with pagination
//    */
//   loadEmployees(page: number = 0): void {
//     this.loading = true;
//     this.error = '';
//
//     this.employeeService.getEmployees(page, this.pageSize).subscribe({
//       next: (response) => {
//         this.employees = response.data.employees;
//         this.filteredEmployees = this.employees;
//         this.currentPage = response.data.page;
//         this.totalPages = response.data.totalPages;
//         this.totalElements = response.data.totalElements;
//         this.loading = false;
//       },
//       error: (error) => {
//         this.error = error.message || 'Failed to load employees';
//         this.loading = false;
//         console.error('Error loading employees:', error);
//       }
//     });
//   }
//
//   /**
//    * Search employees
//    */
//   onSearch(): void {
//     if (!this.searchTerm || this.searchTerm.trim() === '') {
//       this.filteredEmployees = this.employees;
//       return;
//     }
//
//     this.loading = true;
//     this.employeeService.searchEmployees(this.searchTerm).subscribe({
//       next: (response) => {
//         this.filteredEmployees = response.data.employees;
//         this.loading = false;
//       },
//       error: (error) => {
//         this.error = error.message || 'Failed to search employees';
//         this.loading = false;
//         console.error('Error searching employees:', error);
//       }
//     });
//   }
//
//   /**
//    * Clear search
//    */
//   clearSearch(): void {
//     this.searchTerm = '';
//     this.filteredEmployees = this.employees;
//   }
//
//   /**
//    * Navigate to employee detail
//    */
//   viewEmployee(id: number): void {
//     this.router.navigate(['/employee/employee', id]);
//   }
//
//   /**
//    * Navigate to new employee form
//    */
//   addNewEmployee(): void {
//     this.router.navigate(['/employee/new']);
//   }
//
//   /**
//    * Pagination - go to page
//    */
//   goToPage(page: number): void {
//     if (page >= 0 && page < this.totalPages) {
//       this.loadEmployees(page);
//     }
//   }
//
//   /**
//    * Pagination - next page
//    */
//   nextPage(): void {
//     if (this.currentPage < this.totalPages - 1) {
//       this.loadEmployees(this.currentPage + 1);
//     }
//   }
//
//   /**
//    * Pagination - previous page
//    */
//   previousPage(): void {
//     if (this.currentPage > 0) {
//       this.loadEmployees(this.currentPage - 1);
//     }
//   }
//
//   /**
//    * Get employee initials for avatar
//    */
//   getInitials(firstName: string, lastName: string): string {
//     return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
//   }
//
//   /**
//    * Get status badge class
//    */
//   getStatusClass(status: string): string {
//     const statusMap: { [key: string]: string } = {
//       'ACTIVE': 'badge-success',
//       'INACTIVE': 'badge-secondary',
//       'ON_LEAVE': 'badge-warning',
//       'TERMINATED': 'badge-danger',
//       'PROBATION': 'badge-info'
//     };
//     return statusMap[status] || 'badge-secondary';
//   }
//
//   /**
//    * Format date
//    */
//   formatDate(dateString: string): string {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
//   }
// }

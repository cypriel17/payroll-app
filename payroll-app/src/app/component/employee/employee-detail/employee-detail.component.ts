import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, EmployeeState } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from 'src/app/service/notification.service';
import { NgForm } from '@angular/forms';
import { EmployeeForm } from '../employee.model';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailComponent implements OnInit {
  employeeState$: Observable<State<CustomHttpResponse<EmployeeState>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<EmployeeState>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;
  private readonly EMPLOYEE_ID: string = 'id';

  constructor(
    private activatedRoute: ActivatedRoute,
    private employeeService: EmployeeService,
    private notification: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.employeeState$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        return this.employeeService.employee$(+params.get(this.EMPLOYEE_ID))
          .pipe(
            map(response => {
              this.notification.onDefault(response.message);
              console.log(response);
              this.dataSubject.next(response);
              return { dataState: DataState.LOADED, appData: response };
            }),
            startWith({ dataState: DataState.LOADING }),
            catchError((error: string) => {
              this.notification.onError(error);
              return of({ dataState: DataState.ERROR, error });
            })
          );
      })
    );
  }

  /**
   * Update employee details
   */
  updateEmployee(employeeForm: NgForm): void {
    this.isLoadingSubject.next(true);
    const employeeData: EmployeeForm = {
      id: this.dataSubject.value.data.employee.id,
      ...employeeForm.value
    };

    this.employeeState$ = this.employeeService.update$(employeeData)
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          this.isLoadingSubject.next(false);
          this.notification.onDefault(response.message);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({
          dataState: DataState.LOADED,
          appData: this.dataSubject.value
        }),
        catchError((error: string) => {
          this.isLoadingSubject.next(false);
          this.notification.onError(error);
          return of({
            dataState: DataState.LOADED,
            appData: this.dataSubject.value,
            error
          });
        })
      );
  }

  /**
   * Upload employee photo
   */
  updatePhoto(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      this.isLoadingSubject.next(true);
      this.employeeService.uploadPhoto$(this.dataSubject.value.data.employee.id, file)
        .subscribe({
          next: (response) => {
            this.notification.onDefault(response.message);
            this.ngOnInit(); // Reload employee data
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            this.notification.onError(error);
            this.isLoadingSubject.next(false);
          }
        });
    }
  }

  /**
   * Delete employee
   */
  deleteEmployee(): void {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      this.isLoadingSubject.next(true);
      this.employeeService.deleteEmployee$(this.dataSubject.value.data.employee.id)
        .subscribe({
          next: (response) => {
            this.notification.onDefault(response.message);
            this.router.navigate(['/employees']);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            this.notification.onError(error);
            this.isLoadingSubject.next(false);
          }
        });
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get employee initials
   */
  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}

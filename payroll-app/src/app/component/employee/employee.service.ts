import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Employee, EmployeeForm, Department, Designation } from './employee.model';
import { CustomHttpResponse, Page, EmployeeState } from '../../interface/appstates';
import { UserModel } from '../profile/user.model';
import { EmployeeStats } from '../../interface/employee-state';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly server: string = 'http://localhost:8081';

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of employees
   */
  employees$ = (page: number = 0) => <Observable<CustomHttpResponse<Page<Employee> & UserModel & EmployeeStats>>>
    this.http.get<CustomHttpResponse<Page<Employee> & UserModel & EmployeeStats>>
    (`${this.server}/employee/list?page=${page}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee by ID
   */
  employee$ = (employeeId: number) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/employee/get/${employeeId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee by employee ID (e.g., EMP001)
   */
  employeeByEmployeeId$ = (employeeId: string) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/employee/by-employee-id/${employeeId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee by user ID
   */
  employeeByUserId$ = (userId: number) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/employee/by-user/${userId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Search employees by name, email, or employee ID
   */
  searchEmployees$ = (name: string = '', page: number = 0) => <Observable<CustomHttpResponse<Page<Employee> & UserModel>>>
    this.http.get<CustomHttpResponse<Page<Employee> & UserModel>>
    (`${this.server}/employee/search?name=${name}&page=${page}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employees by department
   */
  employeesByDepartment$ = (departmentId: number) => <Observable<CustomHttpResponse<{ employees: Employee[] } & UserModel>>>
    this.http.get<CustomHttpResponse<{ employees: Employee[] } & UserModel>>
    (`${this.server}/employee/by-department/${departmentId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employees by status
   */
  employeesByStatus$ = (status: string, page: number = 0) => <Observable<CustomHttpResponse<Page<Employee> & UserModel>>>
    this.http.get<CustomHttpResponse<Page<Employee> & UserModel>>
    (`${this.server}/employee/by-status/${status}?page=${page}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Create new employee
   */
  newEmployee$ = (employeeForm: EmployeeForm) => <Observable<CustomHttpResponse<Employee & UserModel>>>
    this.http.post<CustomHttpResponse<Employee & UserModel>>
    (`${this.server}/employee/create`, employeeForm)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Update existing employee
   */
  update$ = (employeeForm: EmployeeForm) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.put<CustomHttpResponse<EmployeeState>>
    (`${this.server}/employee/update`, employeeForm)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Delete/Deactivate employee
   */
  deleteEmployee$ = (id: number) => <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/employee/delete/${id}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Upload employee photo
   */
  uploadPhoto$ = (id: number, file: File) => <Observable<CustomHttpResponse<{ imageUrl: string }>>>
    this.http.put<CustomHttpResponse<{ imageUrl: string }>>
    (`${this.server}/employee/photo/${id}`, this.getFormData(file))
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Link employee to user account
   */
  linkEmployeeToUser$ = (employeeId: number, userId: number) => <Observable<CustomHttpResponse<any>>>
    this.http.post<CustomHttpResponse<any>>
    (`${this.server}/employee/link-user/${employeeId}/${userId}`, {})
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee statistics
   */
  employeeStats$ = () => <Observable<CustomHttpResponse<EmployeeStats>>>
    this.http.get<CustomHttpResponse<EmployeeStats>>
    (`${this.server}/employee/stats`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Download employee report
   */
  downloadReport$ = () => <Observable<HttpEvent<Blob>>>
    this.http.get(`${this.server}/employee/download/report`,
      { reportProgress: true, observe: 'events', responseType: 'blob' })
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get all departments
   */
  departments$ = () => <Observable<CustomHttpResponse<{ departments: Department[] } & UserModel>>>
    this.http.get<CustomHttpResponse<{ departments: Department[] } & UserModel>>
    (`${this.server}/department/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get all designations
   */
  designations$ = () => <Observable<CustomHttpResponse<{ designations: Designation[] } & UserModel>>>
    this.http.get<CustomHttpResponse<{ designations: Designation[] } & UserModel>>
    (`${this.server}/designation/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Create FormData for file upload
   */
  private getFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client error occurred - ${error.error.message}`;
    } else {
      if (error.error.reason) {
        errorMessage = error.error.reason;
        console.log(errorMessage);
      } else {
        errorMessage = `An error occurred - Error status ${error.status}`;
      }
    }
    return throwError(() => errorMessage);
  }
}


// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError, tap } from 'rxjs/operators';
// import { Employee, EmployeeForm, Department, Designation, ApiResponse, PagedResponse } from './employee.model';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class EmployeeService {
//   private readonly apiUrl = 'http://localhost:8081/employee';
//
//   constructor(private http: HttpClient) { }
//
//   /**
//    * Get paginated list of employees
//    */
//   getEmployees(page: number = 0, size: number = 10): Observable<ApiResponse<PagedResponse<Employee>>> {
//     const params = new HttpParams()
//       .set('page', page.toString())
//       .set('size', size.toString());
//
//     return this.http.get<ApiResponse<PagedResponse<Employee>>>(`${this.apiUrl}/list`, { params })
//       .pipe(
//         tap(response => console.log('Employees fetched:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Get employee by ID
//    */
//   getEmployee(id: number): Observable<ApiResponse<{ employee: Employee }>> {
//     return this.http.get<ApiResponse<{ employee: Employee }>>(`${this.apiUrl}/get/${id}`)
//       .pipe(
//         tap(response => console.log('Employee fetched:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Get employee by employee ID (e.g., EMP001)
//    */
//   getEmployeeByEmployeeId(employeeId: string): Observable<ApiResponse<{ employee: Employee }>> {
//     return this.http.get<ApiResponse<{ employee: Employee }>>(`${this.apiUrl}/by-employee-id/${employeeId}`)
//       .pipe(
//         tap(response => console.log('Employee fetched by employee ID:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Get employee by user ID
//    */
//   getEmployeeByUserId(userId: number): Observable<ApiResponse<{ employee: Employee }>> {
//     return this.http.get<ApiResponse<{ employee: Employee }>>(`${this.apiUrl}/by-user/${userId}`)
//       .pipe(
//         tap(response => console.log('Employee fetched by user ID:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Search employees by name, email, or employee ID
//    */
//   searchEmployees(searchTerm: string): Observable<ApiResponse<{ employees: Employee[] }>> {
//     const params = new HttpParams().set('name', searchTerm);
//
//     return this.http.get<ApiResponse<{ employees: Employee[] }>>(`${this.apiUrl}/search`, { params })
//       .pipe(
//         tap(response => console.log('Search results:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Get employees by department
//    */
//   getEmployeesByDepartment(departmentId: number): Observable<ApiResponse<{ employees: Employee[] }>> {
//     return this.http.get<ApiResponse<{ employees: Employee[] }>>(`${this.apiUrl}/by-department/${departmentId}`)
//       .pipe(
//         tap(response => console.log('Employees by department:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Create new employee
//    */
//   createEmployee(employeeForm: EmployeeForm): Observable<ApiResponse<{ employee: Employee }>> {
//     return this.http.post<ApiResponse<{ employee: Employee }>>(`${this.apiUrl}/create`, employeeForm)
//       .pipe(
//         tap(response => console.log('Employee created:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Update existing employee
//    */
//   updateEmployee(employeeForm: EmployeeForm): Observable<ApiResponse<{ employee: Employee }>> {
//     return this.http.put<ApiResponse<{ employee: Employee }>>(`${this.apiUrl}/update`, employeeForm)
//       .pipe(
//         tap(response => console.log('Employee updated:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Delete/Deactivate employee
//    */
//   deleteEmployee(id: number): Observable<ApiResponse<any>> {
//     return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/delete/${id}`)
//       .pipe(
//         tap(response => console.log('Employee deleted:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Upload employee photo
//    */
//   uploadPhoto(id: number, file: File): Observable<ApiResponse<{ imageUrl: string }>> {
//     const formData = new FormData();
//     formData.append('file', file);
//
//     return this.http.put<ApiResponse<{ imageUrl: string }>>(`${this.apiUrl}/photo/${id}`, formData)
//       .pipe(
//         tap(response => console.log('Photo uploaded:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Link employee to user account
//    */
//   linkEmployeeToUser(employeeId: number, userId: number): Observable<ApiResponse<any>> {
//     return this.http.post<ApiResponse<any>>(`${this.apiUrl}/link-user/${employeeId}/${userId}`, {})
//       .pipe(
//         tap(response => console.log('Employee linked to user:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Get employee statistics
//    */
//   getStats(): Observable<ApiResponse<{ totalEmployees: number }>> {
//     return this.http.get<ApiResponse<{ totalEmployees: number }>>(`${this.apiUrl}/stats`)
//       .pipe(
//         tap(response => console.log('Employee stats:', response)),
//         catchError(this.handleError)
//       );
//   }
//
//   /**
//    * Error handler
//    */
//   private handleError(error: HttpErrorResponse) {
//     let errorMessage = 'An error occurred';
//
//     if (error.error instanceof ErrorEvent) {
//       // Client-side error
//       errorMessage = `Error: ${error.error.message}`;
//     } else {
//       // Server-side error
//       errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
//     }
//
//     console.error('HTTP Error:', errorMessage);
//     return throwError(() => new Error(errorMessage));
//   }
// }

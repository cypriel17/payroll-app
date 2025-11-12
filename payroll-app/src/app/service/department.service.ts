import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Department, DepartmentForm } from '../component/department/department.model';
import { DepartmentState } from '../interface/department-state';

/**
 * Service for managing department operations
 */
@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/departments';

  // State management
  private departmentStateSubject = new BehaviorSubject<DepartmentState>({
    departments: [],
    department: null,
    loading: false,
    error: null,
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10
  });

  public departmentState$ = this.departmentStateSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current state
   */
  private get state(): DepartmentState {
    return this.departmentStateSubject.value;
  }

  /**
   * Update state
   */
  private setState(newState: Partial<DepartmentState>): void {
    this.departmentStateSubject.next({
      ...this.state,
      ...newState
    });
  }

  /**
   * Get all departments with pagination
   */
  getDepartments(page: number = 0, size: number = 10): Observable<any> {
    this.setState({ loading: true, error: null });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(response => {
        const pageData = response.data.page;
        this.setState({
          departments: pageData.content || pageData,
          totalElements: response.data.totalElements || pageData.totalElements || 0,
          totalPages: response.data.totalPages || pageData.totalPages || 0,
          currentPage: page,
          pageSize: size,
          loading: false
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.message || 'Failed to load departments' });
        throw error;
      })
    );
  }

  /**
   * Get all departments without pagination (for dropdowns)
   */
  getAllDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`).pipe(
      tap(response => {
        this.setState({
          departments: response.data.departments || []
        });
      }),
      catchError(error => {
        this.setState({ error: error.message || 'Failed to load departments' });
        throw error;
      })
    );
  }

  /**
   * Search departments
   */
  searchDepartments(query: string, page: number = 0, size: number = 10): Observable<any> {
    this.setState({ loading: true, error: null });

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      tap(response => {
        const pageData = response.data.page;
        this.setState({
          departments: pageData.content || pageData,
          totalElements: response.data.totalElements || pageData.totalElements || 0,
          totalPages: response.data.totalPages || pageData.totalPages || 0,
          currentPage: page,
          pageSize: size,
          loading: false
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.message || 'Search failed' });
        throw error;
      })
    );
  }

  /**
   * Get department by ID
   */
  getDepartmentById(id: number): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        this.setState({
          department: response.data.department,
          loading: false
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.message || 'Failed to load department' });
        throw error;
      })
    );
  }

  /**
   * Create new department
   */
  createDepartment(form: DepartmentForm): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.post<any>(this.apiUrl, form).pipe(
      tap(response => {
        this.setState({ loading: false });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to create department' });
        throw error;
      })
    );
  }

  /**
   * Update existing department
   */
  updateDepartment(id: number, form: DepartmentForm): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.put<any>(`${this.apiUrl}/${id}`, form).pipe(
      tap(response => {
        this.setState({ loading: false });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to update department' });
        throw error;
      })
    );
  }

  /**
   * Delete department
   */
  deleteDepartment(id: number): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        // Remove from local state
        const updatedDepartments = this.state.departments.filter(dept => dept.id !== id);
        this.setState({
          departments: updatedDepartments,
          loading: false
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to delete department' });
        throw error;
      })
    );
  }

  /**
   * Get departments by manager
   */
  getDepartmentsByManager(managerId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/manager/${managerId}`).pipe(
      tap(response => {
        this.setState({
          departments: response.data.departments || []
        });
      }),
      catchError(error => {
        this.setState({ error: error.message || 'Failed to load departments' });
        throw error;
      })
    );
  }

  /**
   * Get department count
   */
  getDepartmentCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/count`);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.setState({ error: null });
  }

  /**
   * Reset state
   */
  resetState(): void {
    this.setState({
      departments: [],
      department: null,
      loading: false,
      error: null,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    });
  }
}

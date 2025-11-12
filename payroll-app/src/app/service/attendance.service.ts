import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  Attendance,
  EmployeeAttendance,
  AttendanceForm,
  AttendanceSummary,
  AttendanceFilter,
  AttendanceState,
  AttendanceType
} from '../interface/attendance-state';
import { CustomHttpResponse, Page } from '../interface/appstates';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly SERVER_URL = 'http://localhost:8081';
  private readonly API_URL = `${this.SERVER_URL}/attendance`;

  private attendanceState$ = new BehaviorSubject<AttendanceState>({
    attendances: [],
    loading: false,
    error: null,
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear()
  });

  public readonly state$ = this.attendanceState$.asObservable();

  constructor(private http: HttpClient) {}

  // Create attendance
  createAttendance(form: AttendanceForm): Observable<CustomHttpResponse<{ attendance: Attendance }>> {
    return this.http.post<CustomHttpResponse<{ attendance: Attendance }>>(this.API_URL, form);
  }

  // Update attendance by ID
  updateAttendance(id: number, form: AttendanceForm): Observable<CustomHttpResponse<{ attendance: Attendance }>> {
    return this.http.put<CustomHttpResponse<{ attendance: Attendance }>>(`${this.API_URL}/${id}`, form);
  }

  // Update attendance by employee and date
  updateAttendanceByEmployeeAndDate(
    employeeId: number,
    date: string,
    form: AttendanceForm
  ): Observable<CustomHttpResponse<{ attendance: Attendance }>> {
    return this.http.put<CustomHttpResponse<{ attendance: Attendance }>>(
      `${this.API_URL}/employee/${employeeId}/date/${date}`,
      form
    );
  }

  // Delete attendance
  deleteAttendance(id: number): Observable<CustomHttpResponse<void>> {
    return this.http.delete<CustomHttpResponse<void>>(`${this.API_URL}/${id}`);
  }

  // Get attendance by ID
  getAttendanceById(id: number): Observable<CustomHttpResponse<{ attendance: Attendance }>> {
    return this.http.get<CustomHttpResponse<{ attendance: Attendance }>>(`${this.API_URL}/${id}`);
  }

  // Get attendance by employee and date
  getAttendanceByEmployeeAndDate(
    employeeId: number,
    date: string
  ): Observable<CustomHttpResponse<{ attendance: Attendance }>> {
    return this.http.get<CustomHttpResponse<{ attendance: Attendance }>>(
      `${this.API_URL}/employee/${employeeId}/date/${date}`
    );
  }

  // Get all attendance for an employee
  getAttendanceByEmployee(employeeId: number): Observable<CustomHttpResponse<{ attendances: Attendance[] }>> {
    return this.http.get<CustomHttpResponse<{ attendances: Attendance[] }>>(
      `${this.API_URL}/employee/${employeeId}`
    );
  }

  // Get attendance by employee and date range
  getAttendanceByEmployeeAndDateRange(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Observable<CustomHttpResponse<{ attendances: Attendance[] }>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<CustomHttpResponse<{ attendances: Attendance[] }>>(
      `${this.API_URL}/employee/${employeeId}/range`,
      { params }
    );
  }

  // Get attendance by date
  getAttendanceByDate(date: string): Observable<CustomHttpResponse<{ attendances: Attendance[] }>> {
    return this.http.get<CustomHttpResponse<{ attendances: Attendance[] }>>(`${this.API_URL}/date/${date}`);
  }

  // Get attendance by date range
  getAttendanceByDateRange(
    startDate: string,
    endDate: string
  ): Observable<CustomHttpResponse<{ attendances: Attendance[] }>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<CustomHttpResponse<{ attendances: Attendance[] }>>(
      `${this.API_URL}/range`,
      { params }
    );
  }

  // Search attendance with filters
  searchAttendance(filter: AttendanceFilter): Observable<CustomHttpResponse<{ page: Page<Attendance> }>> {
    let params = new HttpParams()
      .set('page', filter.page?.toString() || '0')
      .set('size', filter.size?.toString() || '10');

    if (filter.employeeId) {
      params = params.set('employeeId', filter.employeeId.toString());
    }
    if (filter.attendanceType) {
      params = params.set('attendanceType', filter.attendanceType);
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }

    return this.http.get<CustomHttpResponse<{ page: Page<Attendance> }>>(
      `${this.API_URL}/search`,
      { params }
    );
  }

  // Get monthly attendance (calendar view)
  getMonthlyAttendance(year: number, month: number): Observable<CustomHttpResponse<{ attendances: EmployeeAttendance[] }>> {
    this.setLoading(true);
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<CustomHttpResponse<{ attendances: EmployeeAttendance[] }>>(
      `${this.API_URL}/monthly`,
      { params }
    ).pipe(
      tap({
        next: (response) => {
          this.updateState({
            attendances: response.data.attendances,
            loading: false,
            error: null,
            selectedMonth: month,
            selectedYear: year
          });
        },
        error: (error) => {
          this.updateState({
            ...this.attendanceState$.value,
            loading: false,
            error: error.message || 'Failed to load monthly attendance'
          });
        }
      })
    );
  }

  // Get attendance summary for an employee
  getAttendanceSummary(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Observable<CustomHttpResponse<{ summary: AttendanceSummary }>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<CustomHttpResponse<{ summary: AttendanceSummary }>>(
      `${this.API_URL}/employee/${employeeId}/summary`,
      { params }
    );
  }

  // State management helpers
  private updateState(newState: Partial<AttendanceState>): void {
    this.attendanceState$.next({
      ...this.attendanceState$.value,
      ...newState
    });
  }

  private setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  public setSelectedMonth(month: number, year: number): void {
    this.updateState({ selectedMonth: month, selectedYear: year });
  }

  public getCurrentState(): AttendanceState {
    return this.attendanceState$.value;
  }

  // Utility methods
  getAttendanceTypeLabel(type: AttendanceType): string {
    const labels: { [key in AttendanceType]: string } = {
      [AttendanceType.FULL_DAY_PRESENT]: 'Full Day Present',
      [AttendanceType.HALF_DAY_PRESENT]: 'Half Day Present',
      [AttendanceType.FULL_DAY_ABSENCE]: 'Full Day Absence',
      [AttendanceType.LATE_ARRIVAL]: 'Late Arrival',
      [AttendanceType.EARLY_DEPARTURE]: 'Early Departure',
      [AttendanceType.ON_LEAVE]: 'On Leave',
      [AttendanceType.WEEKEND]: 'Weekend',
      [AttendanceType.HOLIDAY]: 'Holiday'
    };
    return labels[type];
  }

  getAttendanceTypeIcon(type: AttendanceType): string {
    const icons: { [key in AttendanceType]: string } = {
      [AttendanceType.FULL_DAY_PRESENT]: '✓',
      [AttendanceType.HALF_DAY_PRESENT]: '◐',
      [AttendanceType.FULL_DAY_ABSENCE]: '✗',
      [AttendanceType.LATE_ARRIVAL]: '⏰',
      [AttendanceType.EARLY_DEPARTURE]: '⏱',
      [AttendanceType.ON_LEAVE]: 'L',
      [AttendanceType.WEEKEND]: 'W',
      [AttendanceType.HOLIDAY]: 'H'
    };
    return icons[type];
  }

  getAttendanceTypeClass(type: AttendanceType): string {
    const classes: { [key in AttendanceType]: string } = {
      [AttendanceType.FULL_DAY_PRESENT]: 'present',
      [AttendanceType.HALF_DAY_PRESENT]: 'half-day',
      [AttendanceType.FULL_DAY_ABSENCE]: 'absent',
      [AttendanceType.LATE_ARRIVAL]: 'late',
      [AttendanceType.EARLY_DEPARTURE]: 'early',
      [AttendanceType.ON_LEAVE]: 'leave',
      [AttendanceType.WEEKEND]: 'weekend',
      [AttendanceType.HOLIDAY]: 'holiday'
    };
    return classes[type];
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CustomHttpResponse, Page } from '../interface/appstates';
import { ExpenseClaim, ExpenseClaimApprovalForm, ExpenseClaimStatus } from '../interface/expense-claim.model';
import { UserModel } from '../component/profile/user.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseClaimService {
  private readonly server: string = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  // Shared response type
  private mapResponse<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(tap(console.log), catchError(this.handleError));
  }

  // Create new expense claim
  createExpenseClaim$ = (expenseClaim: ExpenseClaim) =>
    this.mapResponse(
      this.http.post<CustomHttpResponse<{ page: Page<ExpenseClaim>; user: UserModel }>>(
        `${this.server}/expense-claims/create`,
        expenseClaim
      )
    );

  // Update existing expense claim
  updateExpenseClaim$ = (id: number, expenseClaim: ExpenseClaim) =>
    this.mapResponse(
      this.http.put<CustomHttpResponse<{ page: Page<ExpenseClaim>; user: UserModel }>>(
        `${this.server}/expense-claims/update/${id}`,
        expenseClaim
      )
    );

  // Get all expense claims with pagination
  expenseClaims$ = (page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ page: Page<ExpenseClaim>; user: UserModel }>>(
        `${this.server}/expense-claims/list?page=${page}&size=${size}`
      )
    );

  // Get expense claims by employee
  expenseClaimsByEmployee$ = (employeeId: number, page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ page: Page<ExpenseClaim>; user: UserModel }>>(
        `${this.server}/expense-claims/employee/${employeeId}?page=${page}&size=${size}`
      )
    );

  // Get expense claims by status
  expenseClaimsByStatus$ = (status: ExpenseClaimStatus, page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ page: Page<ExpenseClaim>; user: UserModel }>>(
        `${this.server}/expense-claims/status/${status}?page=${page}&size=${size}`
      )
    );

  // Get single expense claim
  expenseClaim$ = (id: number) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ expenseClaim: ExpenseClaim; user: UserModel }>>(
        `${this.server}/expense-claims/${id}`
      )
    );

  // Search
  searchExpenseClaims$ = (query: string, page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ page: Page<ExpenseClaim>; user: UserModel }>>(
        `${this.server}/expense-claims/search?query=${query}&page=${page}&size=${size}`
      )
    );

  // Approve claim
  approveExpenseClaim$ = (approvalForm: ExpenseClaimApprovalForm) =>
    this.mapResponse(
      this.http.post<CustomHttpResponse<{ expenseClaim: ExpenseClaim; user: UserModel }>>(
        `${this.server}/expense-claims/approve`,
        approvalForm
      )
    );

  // Reject claim
  rejectExpenseClaim$ = (approvalForm: ExpenseClaimApprovalForm) =>
    this.mapResponse(
      this.http.post<CustomHttpResponse<{ expenseClaim: ExpenseClaim; user: UserModel }>>(
        `${this.server}/expense-claims/reject`,
        approvalForm
      )
    );

  // Mark as paid
  markAsPaid$ = (id: number, approvedBy: number) =>
    this.mapResponse(
      this.http.put<CustomHttpResponse<{ expenseClaim: ExpenseClaim; user: UserModel }>>(
        `${this.server}/expense-claims/mark-paid/${id}?approvedBy=${approvedBy}`,
        {}
      )
    );

  // Cancel claim
  cancelExpenseClaim$ = (id: number, employeeId: number) =>
    this.mapResponse(
      this.http.put<CustomHttpResponse<{ expenseClaim: ExpenseClaim; user: UserModel }>>(
        `${this.server}/expense-claims/cancel/${id}?employeeId=${employeeId}`,
        {}
      )
    );

  // Delete
  deleteExpenseClaim$ = (id: number) =>
    this.mapResponse(
      this.http.delete<CustomHttpResponse<void>>(
        `${this.server}/expense-claims/delete/${id}`
      )
    );

  // Download report
  downloadReport$ = (startDate?: string, endDate?: string): Observable<Blob> => {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http
      .get(`${this.server}/expense-claims/download/report`, {
        params,
        responseType: 'blob'
      })
      .pipe(catchError(this.handleError));
  };

  // Statistics
  getStatistics$ = () =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<any>>(
        `${this.server}/expense-claims/statistics`
      )
    );

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage =
      error.error?.reason ||
      (error.error instanceof ErrorEvent
        ? `A client error occurred - ${error.error.message}`
        : `An error occurred - Error status ${error.status}`);

    return throwError(() => errorMessage);
  }
}

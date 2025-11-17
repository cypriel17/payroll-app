// admin-expense-claims.component.ts

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap } from 'rxjs';
import { DataState } from '../../../enum/datastate.enum';
import { CustomHttpResponse, Page } from '../../../interface/appstates';
import { ExpenseClaim, ExpenseClaimStatus, ExpenseClaimApprovalForm } from '../../../interface/expense-claim.model';
import { State } from '../../../interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { ExpenseClaimService } from '../../../service/expense-claim.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  selector: 'app-admin-expense-claims',
  templateUrl: './admin-expense-claims.component.html',
  styleUrls: ['./admin-expense-claims.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminExpenseClaimsComponent implements OnInit {

  expenseClaimsState$: Observable<State<CustomHttpResponse<{
    page: Page<ExpenseClaim>,
    user: UserModel
  }>>>;

  private dataSubject = new BehaviorSubject<CustomHttpResponse<{
    page: Page<ExpenseClaim>,
    user: UserModel
  }>>(null);

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();

  private showDetailsModalSubject = new BehaviorSubject<boolean>(false);
  showDetailsModal$ = this.showDetailsModalSubject.asObservable();

  private showApprovalModalSubject = new BehaviorSubject<boolean>(false);
  showApprovalModal$ = this.showApprovalModalSubject.asObservable();

  readonly DataState = DataState;
  readonly ExpenseClaimStatus = ExpenseClaimStatus;

  currentAdminId: number = 1;
  selectedClaim: ExpenseClaim | null = null;

  filterStatus: ExpenseClaimStatus | 'ALL' = 'ALL';
  searchQuery: string = '';

  approvalAction: 'approve' | 'reject' | 'paid' | null = null;

  approvalForm = {
    remarks: '',
    rejectionReason: ''
  };

  constructor(
    private expenseClaimService: ExpenseClaimService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadExpenseClaims();
  }

  // -----------------------------------------------------------------------
  // LOAD CLAIMS
  // -----------------------------------------------------------------------

  private loadExpenseClaims(): void {

    let request$: Observable<CustomHttpResponse<{ page: Page<ExpenseClaim>, user: UserModel }>>;

    if (this.searchQuery) {
      request$ = this.expenseClaimService.searchExpenseClaims$(this.searchQuery, this.currentPageSubject.value);
    } else if (this.filterStatus !== 'ALL') {
      request$ = this.expenseClaimService.expenseClaimsByStatus$(this.filterStatus as ExpenseClaimStatus, this.currentPageSubject.value);
    } else {
      request$ = this.expenseClaimService.expenseClaims$(this.currentPageSubject.value);
    }

    this.expenseClaimsState$ = request$.pipe(
      map(response => {
        this.dataSubject.next(response);
        this.notificationService.onDefault(response.message);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError(error => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  // -----------------------------------------------------------------------
  // GETTERS
  // -----------------------------------------------------------------------

  getClaims(): ExpenseClaim[] {
    return this.dataSubject.value?.data?.page?.content || [];
  }

  getTotalPages(): number {
    return this.dataSubject.value?.data?.page?.totalPages || 0;
  }

  // -----------------------------------------------------------------------
  // PAGINATION
  // -----------------------------------------------------------------------

  goToPage(pageNumber: number): void {
    this.currentPageSubject.next(pageNumber);

    this.expenseClaimsState$ = this.getRequestObservable(pageNumber).pipe(
      map(response => {
        this.dataSubject.next(response);
        this.notificationService.onDefault(response.message);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
      catchError(error => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
      })
    );
  }

  goToNextOrPreviousPage(direction: string): void {
    this.goToPage(
      direction === 'forward'
        ? this.currentPageSubject.value + 1
        : this.currentPageSubject.value - 1
    );
  }

  private getRequestObservable(page: number): Observable<CustomHttpResponse<{ page: Page<ExpenseClaim>, user: UserModel }>> {
    if (this.searchQuery) {
      return this.expenseClaimService.searchExpenseClaims$(this.searchQuery, page);
    } else if (this.filterStatus !== 'ALL') {
      return this.expenseClaimService.expenseClaimsByStatus$(this.filterStatus as ExpenseClaimStatus, page);
    } else {
      return this.expenseClaimService.expenseClaims$(page);
    }
  }

  // -----------------------------------------------------------------------
  // FILTER / SEARCH
  // -----------------------------------------------------------------------

  onFilterChange(): void {
    this.currentPageSubject.next(0);
    this.loadExpenseClaims();
  }

  onSearch(): void {
    this.currentPageSubject.next(0);
    this.loadExpenseClaims();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  // -----------------------------------------------------------------------
  // DETAILS MODAL
  // -----------------------------------------------------------------------

  viewDetails(claim: ExpenseClaim): void {
    this.selectedClaim = claim;
    this.showDetailsModalSubject.next(true);
  }

  closeDetailsModal(): void {
    this.selectedClaim = null;
    this.showDetailsModalSubject.next(false);
  }

  // -----------------------------------------------------------------------
  // APPROVAL MODAL
  // -----------------------------------------------------------------------

  openApprovalModal(claim: ExpenseClaim, action: 'approve' | 'reject' | 'paid'): void {
    this.selectedClaim = claim;
    this.approvalAction = action;
    this.approvalForm = { remarks: '', rejectionReason: '' };
    this.showApprovalModalSubject.next(true);
  }

  closeApprovalModal(): void {
    this.selectedClaim = null;
    this.approvalAction = null;
    this.approvalForm = { remarks: '', rejectionReason: '' };
    this.showApprovalModalSubject.next(false);
  }

  // -----------------------------------------------------------------------
  // SUBMIT APPROVAL ACTION
  // -----------------------------------------------------------------------

  submitApproval(): void {
    if (!this.selectedClaim || !this.approvalAction) return;

    this.isLoadingSubject.next(true);

    let operation$: Observable<any>;

    switch (this.approvalAction) {
      case 'approve':
        const approveForm: ExpenseClaimApprovalForm = {
          expenseClaimId: this.selectedClaim.id,
          approvedBy: this.currentAdminId,
          remarks: this.approvalForm.remarks
        };
        operation$ = this.expenseClaimService.approveExpenseClaim$(approveForm);
        break;

      case 'reject':
        const rejectForm: ExpenseClaimApprovalForm = {
          expenseClaimId: this.selectedClaim.id,
          approvedBy: this.currentAdminId,
          remarks: this.approvalForm.remarks,
          rejectionReason: this.approvalForm.rejectionReason
        };
        operation$ = this.expenseClaimService.rejectExpenseClaim$(rejectForm);
        break;

      case 'paid':
        operation$ = this.expenseClaimService.markAsPaid$(this.selectedClaim.id, this.currentAdminId);
        break;
    }

    operation$.pipe(
      switchMap(() => {
        this.closeApprovalModal();
        return this.getRequestObservable(this.currentPageSubject.value);
      })
    ).subscribe({
      next: response => {
        this.dataSubject.next(response);

        const messages = {
          approve: 'Expense claim approved successfully',
          reject: 'Expense claim rejected successfully',
          paid: 'Expense claim marked as paid'
        };

        this.notificationService.onSuccess(messages[this.approvalAction]);
        this.isLoadingSubject.next(false);
      },
      error: error => {
        this.notificationService.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  // -----------------------------------------------------------------------
  // DOWNLOAD REPORT
  // -----------------------------------------------------------------------

  downloadReport(): void {
    this.expenseClaimService.downloadReport$().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-claims-report-${Date.now()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.notificationService.onSuccess('Report downloaded successfully');
      },
      error: () => {
        this.notificationService.onError('Error downloading report');
      }
    });
  }

  // -----------------------------------------------------------------------
  // STATUS BADGES
  // -----------------------------------------------------------------------

  getStatusClass(status: ExpenseClaimStatus): string {
    switch (status) {
      case ExpenseClaimStatus.PENDING: return 'badge-warning';
      case ExpenseClaimStatus.APPROVED: return 'badge-success';
      case ExpenseClaimStatus.REJECTED: return 'badge-danger';
      case ExpenseClaimStatus.PAID: return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  canApprove(claim: ExpenseClaim): boolean {
    return claim.status === ExpenseClaimStatus.PENDING;
  }

  canMarkPaid(claim: ExpenseClaim): boolean {
    return claim.status === ExpenseClaimStatus.APPROVED;
  }
}

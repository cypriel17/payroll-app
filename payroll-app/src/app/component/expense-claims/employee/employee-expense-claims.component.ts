// employee-expense-claims.component.ts

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap } from 'rxjs';
import { DataState } from '../../../enum/datastate.enum';
import { CustomHttpResponse, Page } from '../../../interface/appstates';
import { ExpenseClaim, ExpenseItem, ExpenseClaimStatus } from '../../../interface/expense-claim.model';
import { State } from '../../../interface/state';
import { ExpenseClaimService } from '../../../service/expense-claim.service';
import { NotificationService } from '../../../service/notification.service';
import { Router } from '@angular/router';

// ✅ IMPORT USERMODEL (Corrected)
import { UserModel } from '../../../component/profile/user.model';

@Component({
  selector: 'app-employee-expense-claims',
  templateUrl: './employee-expense-claims.component.html',
  styleUrls: ['./employee-expense-claims.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeExpenseClaimsComponent implements OnInit {

  // ✅ Correct response type using UserModel
  expenseClaimsState$: Observable<State<CustomHttpResponse<{ page: Page<ExpenseClaim>, user: UserModel }>>>;

  // ✅ Fix BehaviorSubject type
  private dataSubject = new BehaviorSubject<CustomHttpResponse<{ page: Page<ExpenseClaim>, user: UserModel }>>(null);

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();

  private showModalSubject = new BehaviorSubject<boolean>(false);
  showModal$ = this.showModalSubject.asObservable();

  readonly DataState = DataState;
  readonly ExpenseClaimStatus = ExpenseClaimStatus;

  currentEmployeeId: number = 1; // TODO: Replace with real logged-in user

  newClaim: ExpenseClaim = this.initializeNewClaim();
  editingClaim: ExpenseClaim | null = null;

  constructor(
    private expenseClaimService: ExpenseClaimService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExpenseClaims();
  }

  private loadExpenseClaims(): void {
    this.expenseClaimsState$ = this.expenseClaimService.expenseClaimsByEmployee$(
      this.currentEmployeeId,
      this.currentPageSubject.value
    ).pipe(
      map(response => {
        this.dataSubject.next(response);
        this.notificationService.onDefault(response.message);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: string) => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  getClaims = (): ExpenseClaim[] => {
    return this.dataSubject.value?.data?.page?.content || [];
  };

  getTotalPages = (): number => {
    return this.dataSubject.value?.data?.page?.totalPages || 0;
  };

  goToPage(pageNumber?: number): void {
    this.expenseClaimsState$ = this.expenseClaimService.expenseClaimsByEmployee$(
      this.currentEmployeeId,
      pageNumber
    ).pipe(
      map(response => {
        this.dataSubject.next(response);
        this.currentPageSubject.next(pageNumber);
        this.notificationService.onDefault(response.message);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
      catchError((error: string) => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
      })
    );
  }

  goToNextOrPreviousPage(direction?: string): void {
    this.goToPage(direction === 'forward'
      ? this.currentPageSubject.value + 1
      : this.currentPageSubject.value - 1
    );
  }

  private initializeNewClaim(): ExpenseClaim {
    return {
      employeeId: this.currentEmployeeId,
      claimDate: new Date().toISOString().split('T')[0],
      purpose: '',
      expenseItems: [this.createEmptyExpenseItem()]
    };
  }

  private createEmptyExpenseItem(): ExpenseItem {
    return {
      expenseDate: new Date().toISOString().split('T')[0],
      payTo: '',
      description: '',
      amount: 0,
      receiptAttached: false
    };
  }

  openCreateModal(): void {
    this.newClaim = this.initializeNewClaim();
    this.editingClaim = null;
    this.showModalSubject.next(true);
  }

  openEditModal(claim: ExpenseClaim): void {
    if (claim.status === ExpenseClaimStatus.PENDING) {
      this.editingClaim = { ...claim };
      this.showModalSubject.next(true);
    } else {
      this.notificationService.onError('Only pending claims can be edited');
    }
  }

  closeModal(): void {
    this.showModalSubject.next(false);
    this.editingClaim = null;
  }

  addExpenseItem(): void {
    const claim = this.editingClaim || this.newClaim;
    claim.expenseItems.push(this.createEmptyExpenseItem());
  }

  removeExpenseItem(index: number): void {
    const claim = this.editingClaim || this.newClaim;
    if (claim.expenseItems.length > 1) {
      claim.expenseItems.splice(index, 1);
    } else {
      this.notificationService.onError('At least one expense item is required');
    }
  }

  calculateTotal(): number {
    const claim = this.editingClaim || this.newClaim;
    return claim.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  onSubmit(): void {
    const claim = this.editingClaim || this.newClaim;

    if (!claim.claimDate || !claim.expenseItems.length) {
      this.notificationService.onError('Please fill in all required fields');
      return;
    }

    const invalidItems = claim.expenseItems.some(item =>
      !item.expenseDate || !item.payTo || !item.description || item.amount <= 0
    );

    if (invalidItems) {
      this.notificationService.onError('Please fill in all expense item details');
      return;
    }

    this.isLoadingSubject.next(true);

    const operation$ = this.editingClaim
      ? this.expenseClaimService.updateExpenseClaim$(this.editingClaim.id, claim)
      : this.expenseClaimService.createExpenseClaim$(claim);

    operation$.pipe(
      switchMap(() => {
        this.closeModal();
        return this.expenseClaimService.expenseClaimsByEmployee$(
          this.currentEmployeeId,
          this.currentPageSubject.value
        );
      })
    ).subscribe({
      next: (response) => {
        this.dataSubject.next(response);
        this.notificationService.onSuccess(
          this.editingClaim
            ? 'Expense claim updated successfully'
            : 'Expense claim created successfully'
        );
        this.isLoadingSubject.next(false);
        this.loadExpenseClaims();
      },
      error: (error) => {
        this.notificationService.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  cancelClaim(claim: ExpenseClaim): void {
    if (confirm('Are you sure you want to cancel this claim?')) {
      this.isLoadingSubject.next(true);
      this.expenseClaimService.cancelExpenseClaim$(claim.id, this.currentEmployeeId)
        .pipe(
          switchMap(() =>
            this.expenseClaimService.expenseClaimsByEmployee$(
              this.currentEmployeeId,
              this.currentPageSubject.value
            )
          )
        )
        .subscribe({
          next: (response) => {
            this.dataSubject.next(response);
            this.notificationService.onSuccess('Claim cancelled successfully');
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            this.notificationService.onError(error);
            this.isLoadingSubject.next(false);
          }
        });
    }
  }

  viewClaimDetails(claim: ExpenseClaim): void {
    console.log('Viewing claim:', claim);
  }

  getStatusClass(status: ExpenseClaimStatus): string {
    switch (status) {
      case ExpenseClaimStatus.PENDING:
        return 'badge-warning';
      case ExpenseClaimStatus.APPROVED:
        return 'badge-success';
      case ExpenseClaimStatus.REJECTED:
        return 'badge-danger';
      case ExpenseClaimStatus.PAID:
        return 'badge-info';
      case ExpenseClaimStatus.CANCELLED:
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }
}

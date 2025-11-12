import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataState } from "../../../enum/datastate.enum";
import { LeaveService } from "../../../service/leave.service";
import {
  Leave,
  LeaveStatus,
  LeaveType,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LeaveApproval
} from "../../../interface/leave-state";

@Component({
  selector: 'app-admin-leave',
  templateUrl: './admin-leave.component.html',
  styleUrls: ['./admin-leave.component.css']
})
export class AdminLeaveComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current admin/manager (get from auth service)
  currentAdminId: number = 2; // Replace with actual admin ID from auth

  // State
  leaves: Leave[] = [];
  allLeaves: Leave[] = [];
  selectedLeave: Leave | null = null;
  dataState = DataState;
  currentDataState: DataState = DataState.LOADED;
  error: string | null = null;
  pendingCount: number = 0;
  upcomingLeaves: Leave[] = [];

  // Forms
  approvalForm: FormGroup;
  showApprovalModal: boolean = false;
  approvalAction: 'approve' | 'reject' = 'approve';

  // Filters
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming' = 'pending';
  searchQuery: string = '';
  selectedStatus: LeaveStatus | 'all' = 'all';
  selectedType: LeaveType | 'all' = 'all';

  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements: number = 0;
  totalPages: number = 0;

  // Enums for template
  leaveTypes = Object.values(LeaveType);
  leaveStatuses = Object.values(LeaveStatus);
  leaveTypeLabels = LEAVE_TYPE_LABELS;
  leaveStatusLabels = LEAVE_STATUS_LABELS;
  LeaveStatus = LeaveStatus;

  constructor(
    private formBuilder: FormBuilder,
    private leaveService: LeaveService
  ) {
    this.approvalForm = this.createApprovalForm();
  }

  ngOnInit(): void {
    this.subscribeToState();
    this.loadPendingLeaves();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createApprovalForm(): FormGroup {
    return this.formBuilder.group({
      remarks: [''],
      rejectionReason: ['']
    });
  }

  private subscribeToState(): void {
    this.leaveService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentDataState = state.dataState;
        this.leaves = state.leaves || [];
        this.allLeaves = state.leaves || [];
        this.error = state.error || null;
      });
  }

  private loadStatistics(): void {
    this.leaveService.getPendingCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.pendingCount = count);

    this.leaveService.getUpcomingLeaves(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe(leaves => this.upcomingLeaves = leaves);
  }

  // Load methods
  private loadPendingLeaves(): void {
    this.leaveService.getLeavesByStatus(LeaveStatus.PENDING, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loadAllLeaves(): void {
    this.leaveService.getAllLeaves(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // Tab actions
  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming'): void {
    this.activeTab = tab;
    this.currentPage = 0;
    this.searchQuery = '';

    switch (tab) {
      case 'all':
        this.loadAllLeaves();
        break;
      case 'pending':
        this.leaveService.getLeavesByStatus(LeaveStatus.PENDING, this.currentPage, this.pageSize)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        break;
      case 'approved':
        this.leaveService.getLeavesByStatus(LeaveStatus.APPROVED, this.currentPage, this.pageSize)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        break;
      case 'rejected':
        this.leaveService.getLeavesByStatus(LeaveStatus.REJECTED, this.currentPage, this.pageSize)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        break;
      case 'upcoming':
        this.leaves = this.upcomingLeaves;
        break;
    }
  }

  // Search and filter
  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadPendingLeaves();
      return;
    }

    this.leaveService.searchLeaves(this.searchQuery, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(l => l.status === this.selectedStatus);
    }

    if (this.selectedType !== 'all') {
      filtered = filtered.filter(l => l.leaveType === this.selectedType);
    }

    this.leaves = filtered;
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.searchQuery = '';
    this.loadPendingLeaves();
  }

  // Approval actions
  viewLeaveDetails(leave: Leave): void {
    this.selectedLeave = leave;
    if (leave.id) {
      this.leaveService.getLeaveById(leave.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  openApprovalModal(leave: Leave, action: 'approve' | 'reject'): void {
    this.selectedLeave = leave;
    this.approvalAction = action;
    this.showApprovalModal = true;
    this.approvalForm.reset();

    if (action === 'approve') {
      this.approvalForm.get('rejectionReason')?.clearValidators();
    } else {
      this.approvalForm.get('rejectionReason')?.setValidators([Validators.required]);
    }
    this.approvalForm.get('rejectionReason')?.updateValueAndValidity();
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedLeave = null;
    this.approvalForm.reset();
  }

  submitApproval(): void {
    if (!this.selectedLeave || !this.selectedLeave.id) return;

    if (this.approvalAction === 'reject' && this.approvalForm.get('rejectionReason')?.invalid) {
      alert('Please provide a rejection reason');
      return;
    }

    const approval: LeaveApproval = {
      leaveId: this.selectedLeave.id,
      status: this.approvalAction === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
      approvedBy: this.currentAdminId,
      remarks: this.approvalForm.value.remarks,
      rejectionReason: this.approvalForm.value.rejectionReason
    };

    const action$ = this.approvalAction === 'approve'
      ? this.leaveService.approveLeave(approval)
      : this.leaveService.rejectLeave(approval);

    action$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert(`Leave ${this.approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`);
          this.closeApprovalModal();
          this.loadPendingLeaves();
          this.loadStatistics();
        },
        error: (error) => {
          alert(error.error?.message || `Failed to ${this.approvalAction} leave`);
        }
      });
  }

  quickApprove(leave: Leave): void {
    if (!leave.id) return;

    if (confirm(`Are you sure you want to approve this leave request for ${leave.employeeName}?`)) {
      const approval: LeaveApproval = {
        leaveId: leave.id,
        status: LeaveStatus.APPROVED,
        approvedBy: this.currentAdminId
      };

      this.leaveService.approveLeave(approval)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Leave approved successfully');
            this.loadPendingLeaves();
            this.loadStatistics();
          },
          error: (error) => {
            alert(error.error?.message || 'Failed to approve leave');
          }
        });
    }
  }

  // Helper methods
  get filteredLeaves(): Leave[] {
    return this.leaves;
  }

  getStatusClass(status: LeaveStatus): string {
    switch (status) {
      case LeaveStatus.PENDING:
        return 'status-pending';
      case LeaveStatus.APPROVED:
        return 'status-approved';
      case LeaveStatus.REJECTED:
        return 'status-rejected';
      case LeaveStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getLeaveTypeClass(type: LeaveType): string {
    switch (type) {
      case LeaveType.ANNUAL:
        return 'type-annual';
      case LeaveType.SICK:
        return 'type-sick';
      case LeaveType.FAMILY_RESPONSIBILITY:
        return 'type-family';
      default:
        return 'type-other';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.leaveService.calculateBusinessDays(start, end);
  }

  canApprove(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING;
  }

  // Export functionality (optional)
  exportToExcel(): void {
    // Implement export functionality if needed
    console.log('Export to Excel');
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPendingLeaves();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPendingLeaves();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPendingLeaves();
  }
}

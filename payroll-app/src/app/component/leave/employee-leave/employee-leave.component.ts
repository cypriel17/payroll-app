import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataState } from '../../../enum/datastate.enum';
import { LeaveService } from '../../../service/leave.service';
import {
  Leave,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LeaveRequest
} from '../../../interface/leave-state';

@Component({
  selector: 'app-employee-leave',
  templateUrl: './employee-leave.component.html',
  styleUrls: ['./employee-leave.component.css']
})
export class EmployeeLeaveComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current employee (you should get this from your auth service)
  currentEmployeeId: number = 1; // Replace with actual employee ID from auth

  // State
  leaves: Leave[] = [];
  leaveBalances: LeaveBalance[] = [];
  dataState = DataState;
  currentDataState: DataState = DataState.LOADED;
  error: string | null = null;

  // Forms
  leaveForm: FormGroup;
  showLeaveForm: boolean = false;
  editMode: boolean = false;
  currentLeaveId: number | null = null;

  // Filter and pagination
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  currentYear: number = new Date().getFullYear();

  // Enums for template
  leaveTypes = Object.values(LeaveType);
  leaveTypeLabels = LEAVE_TYPE_LABELS;
  leaveStatusLabels = LEAVE_STATUS_LABELS;
  LeaveStatus = LeaveStatus;

  constructor(
    private formBuilder: FormBuilder,
    private leaveService: LeaveService
  ) {
    this.leaveForm = this.createLeaveForm();
  }

  ngOnInit(): void {
    this.subscribeToState();
    this.loadEmployeeLeaves();
    this.loadLeaveBalances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLeaveForm(): FormGroup {
    return this.formBuilder.group({
      leaveType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: [''],
      remarks: [''],
      doctorNoteAttached: [false],
      doctorNoteUrl: ['']
    });
  }

  private subscribeToState(): void {
    this.leaveService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentDataState = state.dataState;
        this.leaves = state.leaves || [];
        this.leaveBalances = state.leaveBalances || [];
        this.error = state.error || null;
      });
  }

  private loadEmployeeLeaves(): void {
    this.leaveService.getLeavesByEmployee(this.currentEmployeeId, 0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loadLeaveBalances(): void {
    this.leaveService.getLeaveBalances(this.currentEmployeeId, this.currentYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // Form actions
  openLeaveForm(): void {
    this.showLeaveForm = true;
    this.editMode = false;
    this.leaveForm.reset();
  }

  editLeave(leave: Leave): void {
    if (leave.status !== LeaveStatus.PENDING) {
      alert('Only pending leave requests can be edited');
      return;
    }

    this.showLeaveForm = true;
    this.editMode = true;
    this.currentLeaveId = leave.id || null;

    this.leaveForm.patchValue({
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      remarks: leave.remarks,
      doctorNoteAttached: leave.doctorNoteAttached,
      doctorNoteUrl: leave.doctorNoteUrl
    });
  }

  closeLeaveForm(): void {
    this.showLeaveForm = false;
    this.editMode = false;
    this.currentLeaveId = null;
    this.leaveForm.reset();
  }

  onDateChange(): void {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;

    if (startDate && endDate) {
      const days = this.leaveService.calculateBusinessDays(
        new Date(startDate),
        new Date(endDate)
      );
      console.log('Business days:', days);
    }
  }

  submitLeaveRequest(): void {
    if (this.leaveForm.invalid) {
      Object.keys(this.leaveForm.controls).forEach(key => {
        this.leaveForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.leaveForm.value;
    const startDate = new Date(formValue.startDate);
    const endDate = new Date(formValue.endDate);

    if (endDate < startDate) {
      alert('End date cannot be before start date');
      return;
    }

    const numberOfDays = this.leaveService.calculateBusinessDays(startDate, endDate);

    const request: LeaveRequest = {
      employeeId: this.currentEmployeeId,
      leaveType: formValue.leaveType,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      numberOfDays,
      reason: formValue.reason,
      remarks: formValue.remarks,
      doctorNoteAttached: formValue.doctorNoteAttached,
      doctorNoteUrl: formValue.doctorNoteUrl
    };

    if (this.editMode && this.currentLeaveId) {
      this.leaveService.updateLeaveRequest(this.currentLeaveId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Leave request updated successfully');
            this.closeLeaveForm();
            this.loadEmployeeLeaves();
            this.loadLeaveBalances();
          },
          error: (error) => {
            alert(error.error?.message || 'Failed to update leave request');
          }
        });
    } else {
      this.leaveService.createLeaveRequest(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Leave request submitted successfully');
            this.closeLeaveForm();
            this.loadEmployeeLeaves();
            this.loadLeaveBalances();
          },
          error: (error) => {
            alert(error.error?.message || 'Failed to submit leave request');
          }
        });
    }
  }

  cancelLeave(leave: Leave): void {
    if (!leave.id) return;

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.APPROVED) {
      alert('Only pending or approved leaves can be cancelled');
      return;
    }

    if (confirm('Are you sure you want to cancel this leave request?')) {
      this.leaveService.cancelLeave(leave.id, this.currentEmployeeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Leave request cancelled successfully');
            this.loadEmployeeLeaves();
            this.loadLeaveBalances();
          },
          error: (error) => {
            alert(error.error?.message || 'Failed to cancel leave request');
          }
        });
    }
  }

  // Filtering
  get filteredLeaves(): Leave[] {
    switch (this.activeTab) {
      case 'pending':
        return this.leaves.filter(l => l.status === LeaveStatus.PENDING);
      case 'approved':
        return this.leaves.filter(l => l.status === LeaveStatus.APPROVED);
      case 'rejected':
        return this.leaves.filter(l => l.status === LeaveStatus.REJECTED);
      default:
        return this.leaves;
    }
  }

  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
  }

  // Helper methods
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

  getAvailableDays(leaveType: LeaveType): number {
    const balance = this.leaveBalances.find(b => b.leaveType === leaveType);
    return balance ? balance.available : 0;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  canEditOrCancel(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING || leave.status === LeaveStatus.APPROVED;
  }
}

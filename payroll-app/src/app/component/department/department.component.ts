import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepartmentService } from '../../service/department.service';
import { Department, DepartmentForm } from './department.model';
import { DepartmentState } from '../../interface/department-state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Department management component
 */
@Component({
  selector: 'app-departments',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  departmentState: DepartmentState;
  departmentForm: FormGroup;
  searchForm: FormGroup;
  isEditMode = false;
  selectedDepartmentId: number | null = null;
  showDeleteConfirm = false;
  departmentToDelete: number | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private departmentService: DepartmentService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal
  ) {
    this.departmentState = {
      departments: [],
      department: null,
      loading: false,
      error: null,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    };

    // Initialize forms
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      managerId: [null]
    });

    this.searchForm = this.fb.group({
      query: ['']
    });
  }

  ngOnInit(): void {
    // Subscribe to department state
    this.departmentService.departmentState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.departmentState = state;
        this.cdr.markForCheck();
      });

    // Load initial data
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load departments with pagination
   */
  loadDepartments(page: number = 0): void {
    this.currentPage = page;
    this.departmentService.getDepartments(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: (error) => {
          console.error('Error loading departments:', error);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Search departments
   */
  onSearch(): void {
    const query = this.searchForm.get('query')?.value?.trim();

    if (query) {
      this.departmentService.searchDepartments(query, 0, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.cdr.markForCheck(),
          error: (error) => {
            console.error('Error searching departments:', error);
            this.cdr.markForCheck();
          }
        });
    } else {
      this.loadDepartments(0);
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchForm.reset();
    this.loadDepartments(0);
  }

  /**
   * Open modal for creating new department
   */
  openCreateModal(content: any): void {
    this.isEditMode = false;
    this.selectedDepartmentId = null;
    this.departmentForm.reset();
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  /**
   * Open modal for editing department
   */
  openEditModal(content: any, department: Department): void {
    this.isEditMode = true;
    this.selectedDepartmentId = department.id || null;

    this.departmentForm.patchValue({
      name: department.name,
      description: department.description,
      managerId: department.managerId
    });

    this.modalService.open(content, { size: 'lg', centered: true });
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const formValue: DepartmentForm = this.departmentForm.value;

    if (this.isEditMode && this.selectedDepartmentId) {
      this.updateDepartment(this.selectedDepartmentId, formValue);
    } else {
      this.createDepartment(formValue);
    }
  }

  /**
   * Create new department
   */
  private createDepartment(form: DepartmentForm): void {
    this.departmentService.createDepartment(form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.departmentForm.reset();
          this.loadDepartments(this.currentPage);
          alert('Department created successfully!');
        },
        error: (error) => {
          console.error('Error creating department:', error);
          alert(error.error?.message || 'Failed to create department');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Update existing department
   */
  private updateDepartment(id: number, form: DepartmentForm): void {
    this.departmentService.updateDepartment(id, form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.departmentForm.reset();
          this.loadDepartments(this.currentPage);
          alert('Department updated successfully!');
        },
        error: (error) => {
          console.error('Error updating department:', error);
          alert(error.error?.message || 'Failed to update department');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Confirm delete
   */
  confirmDelete(id: number): void {
    this.departmentToDelete = id;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.departmentToDelete = null;
    this.showDeleteConfirm = false;
    this.cdr.markForCheck();
  }

  /**
   * Delete department
   */
  deleteDepartment(): void {
    if (this.departmentToDelete === null) return;

    this.departmentService.deleteDepartment(this.departmentToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.departmentToDelete = null;
          this.loadDepartments(this.currentPage);
          alert('Department deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting department:', error);
          alert(error.error?.message || 'Failed to delete department');
          this.showDeleteConfirm = false;
          this.departmentToDelete = null;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Change page
   */
  onPageChange(page: number): void {
    this.loadDepartments(page);
  }

  /**
   * Change page size
   */
  onPageSizeChange(event: any): void {
    this.pageSize = parseInt(event.target.value, 10);
    this.loadDepartments(0);
  }

  /**
   * Get page numbers for pagination
   */
  getPages(): number[] {
    const totalPages = this.departmentState.totalPages;
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.departmentForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.departmentForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${fieldName} must be at least ${minLength} characters`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `${fieldName} must not exceed ${maxLength} characters`;
    }
    return 'Invalid value';
  }
}

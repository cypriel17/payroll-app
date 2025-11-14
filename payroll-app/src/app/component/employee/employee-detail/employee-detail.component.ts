import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, EmployeeState } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from 'src/app/service/notification.service';
import { NgForm } from '@angular/forms';
import { EmployeeForm } from '../employee.model';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';

interface EmployeeDocument {
  id?: number;
  employeeId: number;
  documentType: string;
  documentName: string;
  documentUrl?: string;
  fileSize?: number;
  fileExtension?: string;
  description?: string;
  isVerified?: boolean;
  createdAt?: string;
}

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

  // ===== FIX: Add server URL =====
  private readonly SERVER_URL = 'http://localhost:8081';

  // Document management
  documents: EmployeeDocument[] = [];
  selectedFile: File | null = null;
  selectedDocumentType: string = '';
  documentDescription: string = '';
  isUploadingDocument: boolean = false;
  uploadProgress: number = 0;

  documentTypes = [
    { value: 'CV', label: 'Curriculum Vitae (CV)' },
    { value: 'ID', label: 'Identity Document' },
    { value: 'WORK_PERMIT', label: 'Work Permit' },
    { value: 'QUALIFICATION', label: 'Qualification Certificates' },
    { value: 'OTHER', label: 'Other Documents' }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private employeeService: EmployeeService,
    private notification: NotificationService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.employeeState$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const employeeId = +params.get(this.EMPLOYEE_ID);
        this.loadDocuments(employeeId);

        return this.employeeService.employee$(employeeId)
          .pipe(
            map(response => {
              this.notification.onDefault(response.message);
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
   * Update employee details - FIXED to include ALL fields
   */
  updateEmployee(employeeForm: NgForm): void {
    this.isLoadingSubject.next(true);

    const currentEmployee = this.dataSubject.value.data.employee;

    // CRITICAL: Include ALL fields to avoid N/A values
    const employeeData: EmployeeForm = {
      id: currentEmployee.id,
      firstName: employeeForm.value.firstName,
      lastName: employeeForm.value.lastName,
      email: employeeForm.value.email,
      phone: employeeForm.value.phone || null,
      dateOfBirth: employeeForm.value.dateOfBirth || null,
      gender: employeeForm.value.gender || null,
      hireDate: currentEmployee.hireDate,
      departmentId: currentEmployee.departmentId || null,
      designationId: currentEmployee.designationId || null,
      designationTitle: currentEmployee.designationTitle || null,
      baseSalary: currentEmployee.baseSalary || 0,
      employmentType: currentEmployee.employmentType || null,
      status: currentEmployee.status || 'ACTIVE',
      address: employeeForm.value.address || null,
      city: employeeForm.value.city || null,
      state: employeeForm.value.state || null,
      country: employeeForm.value.country || 'South Africa',
      postalCode: employeeForm.value.postalCode || null,
      emergencyContactName: employeeForm.value.emergencyContactName || null,
      emergencyContactPhone: employeeForm.value.emergencyContactPhone || null,
      bio: employeeForm.value.bio || null
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

  updatePhoto(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.isLoadingSubject.next(true);
      this.employeeService.uploadPhoto$(this.dataSubject.value.data.employee.id, file)
        .subscribe({
          next: (response) => {
            this.notification.onDefault(response.message);
            this.ngOnInit();
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            this.notification.onError(error);
            this.isLoadingSubject.next(false);
          }
        });
    }
  }

  deleteEmployee(): void {
    if (confirm('Are you sure you want to delete this employee?')) {
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

  // ========== DOCUMENT MANAGEMENT - FIXED ==========

  /**
   * Load documents for an employee
   * FIX: Use full server URL and proper error handling
   */
  loadDocuments(employeeId: number): void {
    console.log(`Loading documents for employee ${employeeId}`);

    this.http.get<any>(`${this.SERVER_URL}/employee/documents/${employeeId}`)
      .pipe(
        catchError((error) => {
          console.error('Error loading documents:', error);
          // Return empty documents array on error instead of failing
          return of({ data: { documents: [] } });
        })
      )
      .subscribe(response => {
        console.log('Documents loaded:', response);
        this.documents = response.data?.documents || [];
        this.cdr.markForCheck();
      });
  }

  /**
   * Handle file selection
   * FIX: Add proper file validation
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        this.notification.onError('File size must be less than 10MB');
        event.target.value = ''; // Reset file input
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.notification.onError('Only PDF, Word, and Image files are allowed');
        event.target.value = ''; // Reset file input
        return;
      }

      this.selectedFile = file;
      console.log('File selected:', file.name);
      this.cdr.markForCheck();
    }
  }

  /**
   * Upload document to server
   * FIX: Use full server URL and improved error handling
   */
  uploadDocument(): void {
    // Validation
    if (!this.selectedFile) {
      this.notification.onError('Please select a file to upload');
      return;
    }

    if (!this.selectedDocumentType) {
      this.notification.onError('Please select a document type');
      return;
    }

    // Build form data
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('documentType', this.selectedDocumentType);
    if (this.documentDescription) {
      formData.append('description', this.documentDescription);
    }

    this.isUploadingDocument = true;
    this.uploadProgress = 0;
    const employeeId = this.dataSubject.value.data.employee.id;

    console.log(`Uploading document for employee ${employeeId}`);

    // FIX: Use full server URL
    this.http.post(`${this.SERVER_URL}/employee/documents/upload/${employeeId}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          console.log(`Upload progress: ${this.uploadProgress}%`);
        } else if (event.type === HttpEventType.Response) {
          console.log('Upload complete:', event.body);
          this.isUploadingDocument = false;
          this.selectedFile = null;
          this.selectedDocumentType = '';
          this.documentDescription = '';
          this.uploadProgress = 0;
          this.notification.onDefault('Document uploaded successfully');
          this.loadDocuments(employeeId);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.isUploadingDocument = false;
        this.uploadProgress = 0;

        // FIX: Better error message extraction
        let errorMessage = 'Failed to upload document';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        this.notification.onError(errorMessage);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Delete a document
   * FIX: Use full server URL and better error handling
   */
  deleteDocument(documentId: number): void {
    if (confirm('Are you sure you want to delete this document?')) {
      console.log(`Deleting document ${documentId}`);

      // FIX: Use full server URL
      this.http.delete(`${this.SERVER_URL}/employee/documents/delete/${documentId}`).subscribe({
        next: (response: any) => {
          console.log('Document deleted:', response);
          this.notification.onDefault('Document deleted successfully');
          this.loadDocuments(this.dataSubject.value.data.employee.id);
        },
        error: (error) => {
          console.error('Delete error:', error);

          // FIX: Better error message extraction
          let errorMessage = 'Failed to delete document';
          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          this.notification.onError(errorMessage);
        }
      });
    }
  }

  /**
   * Download/view a document
   */
  downloadDocument(documentUrl: string): void {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    } else {
      this.notification.onError('Document URL not available');
    }
  }

  /**
   * Get icon class for file type
   */
  getDocumentIcon(fileExtension: string): string {
    if (!fileExtension) return 'bi-file-earmark';
    const ext = fileExtension.toLowerCase();
    if (ext === '.pdf') return 'bi-file-pdf';
    if (['.doc', '.docx'].includes(ext)) return 'bi-file-word';
    if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'bi-file-image';
    return 'bi-file-earmark';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get employee initials for avatar
   */
  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}

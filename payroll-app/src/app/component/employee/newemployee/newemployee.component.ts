import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../../service/employee.service';
import { EmployeeForm } from '../employee.model';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  selector: 'app-newemployee',
  templateUrl: './newemployee.component.html',
  styleUrls: ['./newemployee.component.css']
})
export class NewemployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  // Dropdown options
  employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'];
  genders = ['MALE', 'FEMALE', 'OTHER'];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      hireDate: ['', Validators.required],
      departmentId: [''],
      designationId: [''],
      designationTitle: [''],
      baseSalary: [0],
      employmentType: ['FULL_TIME', Validators.required],
      address: [''],
      city: [''],
      state: [''],
      country: ['South Africa'],
      postalCode: [''],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      bio: ['']
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const employeeData: EmployeeForm = this.employeeForm.value;

    // Use newEmployee$ method (matches the service)
    this.employeeService.newEmployee$(employeeData).subscribe({
      next: (response) => {
        this.success = response.message || 'Employee created successfully!';
        this.notification.onDefault(response.message);
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/employees']);
        }, 1500);
      },
      error: (error) => {
        this.error = error || 'Failed to create employee';
        this.notification.onError(error);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/employees']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return `Minimum length is ${field.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }
}

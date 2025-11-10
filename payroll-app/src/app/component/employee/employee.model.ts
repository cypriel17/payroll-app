export interface Employee {
  id?: number;
  employeeId?: string;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate: string;
  departmentId?: number;
  departmentName?: string;
  designationId?: number;
  designationTitle?: string;
  baseSalary?: number;
  employmentType: string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  imageUrl?: string;
  bio?: string;
  managerName?: string;
  createdAt?: string;
  updatedAt?: string;
}


/**
 * Department Model
 */
export interface Department {
  id?: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  employeeCount?: number;
  createdAt?: string;
}

/**
 * Designation Model
 */
export interface Designation {
  id?: number;
  title: string;
  description?: string;
  level?: string;
  employeeCount?: number;
  createdAt?: string;
}

/**
 * Employee Form (for creating/updating)
 */
export interface EmployeeForm {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate: string;
  departmentId?: number;
  designationId?: number;
  designationTitle?: string;
  baseSalary?: number;
  employmentType: string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bio?: string;
  userId?: number;
}

export interface ApiResponse<T> {
  timeStamp: string;
  statusCode: number;
  status: string;
  message: string;
  data: T;
}


export interface PagedResponse<T> {
  employees: T[];
  page: number;
  totalPages: number;
  totalElements: number;
}


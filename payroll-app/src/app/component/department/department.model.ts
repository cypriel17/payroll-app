/**
 * Department model interface
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
 * Department form data
 */
export interface DepartmentForm {
  name: string;
  description?: string;
  managerId?: number;
}

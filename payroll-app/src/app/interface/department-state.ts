import { Department } from '../component/department/department.model';

/**
 * State interface for Department module
 */
export interface DepartmentState {
  departments: Department[];
  department: Department | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

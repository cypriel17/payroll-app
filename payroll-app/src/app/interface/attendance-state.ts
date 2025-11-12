export interface AttendanceState {
  attendances: EmployeeAttendance[];
  loading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
}

export interface Attendance {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  attendanceDate: string;
  attendanceType: AttendanceType;
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface EmployeeAttendance {
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  designation?: string;
  department?: string;
  dailyAttendance: { [day: number]: AttendanceType };
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  totalLeave: number;
}

export enum AttendanceType {
  FULL_DAY_PRESENT = 'FULL_DAY_PRESENT',
  HALF_DAY_PRESENT = 'HALF_DAY_PRESENT',
  FULL_DAY_ABSENCE = 'FULL_DAY_ABSENCE',
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  EARLY_DEPARTURE = 'EARLY_DEPARTURE',
  ON_LEAVE = 'ON_LEAVE',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY'
}

export interface AttendanceForm {
  employeeId: number;
  attendanceDate: string;
  attendanceType: AttendanceType;
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  totalLeave: number;
}

export interface AttendanceFilter {
  employeeId?: number;
  attendanceType?: AttendanceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}


export interface Holiday {
  id: number;
  holidayName: string;
  holidayDate: string; // ISO date string
  holidayDay: string;
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  countryCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HolidayForm {
  holidayName: string;
  holidayDate: string;
  holidayDay?: string;
  description?: string;
  isRecurring?: boolean;
  isActive?: boolean;
  countryCode?: string;
}

export interface HolidayResponse {
  holidays: Holiday[];
  page: number;
  size: number;
  totalHolidays: number;
  totalPages: number;
}

export interface HolidayStats {
  totalHolidays: number;
  upcomingHolidays: Holiday[];
  currentYearHolidays: number;
  activeHolidays: number;
}

export interface ApiResponse<T> {
  timeStamp: string;
  statusCode: number;
  status: string;
  message: string;
  data: T;
}

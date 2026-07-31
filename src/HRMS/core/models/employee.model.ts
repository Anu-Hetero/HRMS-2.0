export interface Employee {
  id: number;
  empId: string;
  fullName: string;
  gender: string;
  dob: string;
  doj: string;
  employmentType: string;
  designation: string;
  department: string;
  bu?: string;
  status: string;
  setupProgress: number;
  initials?: string;
  avatarColor?: string;
  picture?: string;
}

export interface GenderOption     { genderId: number;     genderName: string; }
export interface EmploymentOption { employmentId: number; employmentName: string; }
export interface DivisionOption   { divisionId: number;   divisionName: string; }
export interface DeptOption       { deptId: number;       deptName: string; }
export interface StatusOption     { statusId: number;     statusName: string; }

export interface EmployeeListPayload {
  user: number;
  division: number | null;
  gender: number | null;
  department: number | null;
  employmentType: number | null;
  status: number | null;
  pageNumber: number;
  pageSize: number;
  search: string | null;
}

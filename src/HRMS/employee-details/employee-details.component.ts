import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { Employee } from '../employees/employees.component';
import { MasterDataService } from '../core/services/master-data.service';
import { ContactService } from '../core/services/contact.service';
import { EmpHeaderComponent } from './components/emp-header/emp-header.component';
import { ContactTabComponent } from './components/contact-tab/contact-tab.component';
import { PersonalTabComponent } from './components/personal-tab/personal-tab.component';
import { FamilyTabComponent } from './components/family-tab/family-tab.component';
import { EducationTabComponent } from './components/education-tab/education-tab.component';
import { ExperienceTabComponent } from './components/experience-tab/experience-tab.component';
import { ReferencesTabComponent } from './components/references-tab/references-tab.component';
import { CtcTabComponent } from './components/ctc-tab/ctc-tab.component';
import { ProfessionalTabComponent } from './components/professional-tab/professional-tab.component';
import { TransfersTabComponent } from './components/transfers-tab/transfers-tab.component';
import { HrActionsTabComponent } from './components/hr-actions-tab/hr-actions-tab.component';
import { ToastService } from '../core/services/toast.service';


export const TABS = [
  { id: 'contact', label: 'Contact Details' },
  { id: 'personal', label: 'Personal Info' },
  { id: 'family', label: 'Family Details' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'references', label: 'References' },
  { id: 'ctc', label: 'CTC' },
  { id: 'professional', label: 'Professional' },
  { id: 'profile', label: 'Profile' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'hr-actions', label: 'HR Actions' },
];

export interface FamilyMember {
  id: number; relation: string;
  transactionId: number | null;
  firstName: string; lastName: string; fullName: string;
  gender: string; bloodGroup: string;
  dob: string; dateOfBirth: string;
  age: number;
  dateOfExpiry: string; dateOfExpire: string;
  occupation: string;
  isPFNominee: boolean; pfPercentage: number | null;
  isGratuityNominee: boolean; gratuityPercentage: number | null;
  status: number; // 1001 = Active, 1002 = Inactive
}

export interface EducationRecord {
  id: number;
  transactionId: number | null;
  qualificationId: string;
  branchId: string | null;
  institute: string;
  universityId: number | null;
  universityName: string;
  yearOfPassing: number;
  percentageOfMarks: number | null;
  educationType: string;   // 'Regular' | 'Distance' | 'Part-Time' — display
  educationTypeId: number; // 1 / 2 / 3 — API value
  isConsidered: number;    // 0 / 1
  isWageReview: number;    // 0 / 1
  isScale: number;         // 0 / 1
  status: number;          // 1001 = Active, 1002 = Inactive
}

export interface ExperienceRecord {
  id: number;
  transactionId: number | null;
  qualificationId: string | null; // resolved from qualification name via master list
  qualification: string;          // name string from API
  branchId: number | null;        // numeric ID from branches API
  branch: string | null;          // name string from API
  fromDate: string;
  toDate: string;
  experienceMonths: number;
  isExperienceRelevant: number;   // 1 = Yes, 0 = No
  designation: string;
  natureOfWork: string | null;
  industryType: number | null;
  functionalArea: number | null;
  employerName: string;
  employerAddress: string | null;
  employerPhone: string | null;
  salaryPerMonth: number | null;
  reasonForLeaving: string | null;
  comments: string | null;
  achievements: string | null;
  status: number;                 // 1001 = Active, 1002 = Inactive
}

export interface ReferenceRecord {
  id: number; referenceType: string; isRelative: boolean; referenceId: string;
  name: string; designation: string; destination: string; contactNumber: string;
  addressLane1: string; addressLane2: string; location: string; state: string;
  city: string; pincode: string; company: string; isRelevant: boolean;
  status: 'Active' | 'In-Active';
}

export interface TransferRecord {
  id: number; transferType: string; transferDetails: string; businessUnit: string;
  costCentre: string; department: string; section: string; designation: string;
  workLocation: string; transferDate: string; reportingDateAndTime: string;
  reportingOfficer: string; employeeId: string; paysheetGroup: string;
  payStructure: string; notes: string; actionType: string; actionBy: string;
  actionDate: string; documentNo: string; documentDate: string;
  documentSource: string; status: string; comments: string;
}

export interface HrActionRecord {
  id: number; category: string; actionConsideredBy: string; employeeId: string;
  actionConsideredDate: string; notes: string; lastWorkingDay: string;
  status: 'Active' | 'In-Active';
}


@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    EmpHeaderComponent, ContactTabComponent, PersonalTabComponent, FamilyTabComponent,
    EducationTabComponent, ExperienceTabComponent, ReferencesTabComponent,
    CtcTabComponent, ProfessionalTabComponent, TransfersTabComponent, HrActionsTabComponent,
  ],
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.scss',
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }`],
})
export class EmployeeDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  tabs = TABS;
  activeTab = 'contact';
  employee: Employee | null = null;
  isNew = false;
  isLoading = false;
  private get userId(): number {
    try {
      const raw = localStorage.getItem('hrmsToken');
      return raw ? (JSON.parse(raw)?.EMPID ?? 0) : 0;
    } catch { return 0; }
  }
  currentEmpId: any;

  editing: Record<string, boolean> = {};

  // ── Family ────────────────────────────────────────────────────────────────
  showFamilyModal = false;
  editingFamilyMemberId: number | null = null;
  editingOriginalRelation: string = '';
  familyMembers: FamilyMember[] = [];
  isFamilySaving = false;
  familySaveError: string | null = null;
  deletingFamilyId: number | null = null;

  // ── Education ─────────────────────────────────────────────────────────────
  showEducationModal = false;
  editingEducationId: number | null = null;
  educationRecords: EducationRecord[] = [];
  isEducationSaving = false;
  educationSaveError: string | null = null;
  deletingEducationId: number | null = null;

  // ── Experience ────────────────────────────────────────────────────────────
  showExperienceModal = false;
  editingExperienceId: number | null = null;
  experienceCalcMonths = 0;
  experienceRecords: ExperienceRecord[] = [];
  isExperienceSaving = false;
  experienceSaveError: string | null = null;
  deletingExperienceId: number | null = null;
  // Experience typeahead state
  isCurrentlyWorking = false;
  expQualificationSearch = '';
  showExpQualificationDropdown = false;
  expBranches: any[] = [];
  isLoadingExpBranches = false;
  showExpBranchHint = false;
  private expBranchHintTimer: ReturnType<typeof setTimeout> | null = null;
  industryTypeSearch = '';
  showIndustryTypeDropdown = false;
  functionalAreaSearch = '';
  showFunctionalAreaDropdown = false;

  // ── References ────────────────────────────────────────────────────────────
  showReferenceModal = false;
  editingReferenceId: number | null = null;
  referenceRecords: ReferenceRecord[] = [];

  // ── Professional ──────────────────────────────────────────────────────────
  professionalData = {
    professional: { department: '', section: '', designation: '', paysheetGroup: '' },
    workLocation: { headQuarter: '', region: '' },
    reportingOfficer: { reportingOfficer: '', employeeId: '', isHOD: false },
    profile: { termsOfService: '', dateOfJoining: '', groupDateOfJoining: '', firstDateOfWork: '', dateOfResign: '' },
    experienceLevel: { experienceLevel: '', incrementType: '' },
  };

  // ── Transfers ─────────────────────────────────────────────────────────────
  showTransferModal = false;
  transferStep: 1 | 2 = 1;
  editingTransferId: number | null = null;
  transferRecords: TransferRecord[] = [];

  // ── HR Actions ────────────────────────────────────────────────────────────
  showHrActionModal = false;
  editingHrActionId: number | null = null;
  hrActionRecords: HrActionRecord[] = [];

  // ── CTC ───────────────────────────────────────────────────────────────────
  ctcData = {
    current: {
      financialYear: '', payStructure: '', grossPerMonth: 0,
      earnings: { gross: 0, basic: 0, ca: 0, education: 0, hra: 0, kitAllow: 0, medicalAllow: 0, splAllow: 0, travelAllow: 0 },
      deductions: { pt: 0, pf: 0, esi: 0 },
      annualBenefits: { medicalPremium: 0, lta: 0, pf: 0, esi: 0, bonus: 0, annualBonus: 0, gratuity: 0, retentionBonus: 0, variablePay: 0, performanceLinkedBonus: 0 },
      totals: { totalEarnings: 0, totalDeductions: 0, totalAnnualBe: 0, netPerMonth: 0, grossPerMonth: 0, ctcPerMonth: 0, netPerYear: 0, grossPerYear: 0, ctcPerYear: 0 },
      statusType: '', actionType: '',
    },
    new: {
      financialYear: '', payStructure: '', proposedGrossPerMonth: '',
      esiCycleConsider: false,
      earnings: { gross: 0, basic: 0, ca: 0, education: 0, hra: 0, kitAllow: 0, medicalAllow: 0, splAllow: 0, travelAllow: 0 },
      deductions: { pt: 0, pf: 0, esi: 0 },
      annualBenefits: { medicalPremium: 0, lta: 0, pf: 0, esi: 0, bonus: 0, annualBonus: 0, gratuity: 0, retentionBonus: 0, variablePay: 0, performanceLinkedBonus: 0 },
      totals: { totalEarnings: 0, totalDeductions: 0, totalAnnualBe: 0, netPerMonth: 0, grossPerMonth: 0, ctcPerMonth: 0, netPerYear: 0, grossPerYear: 0, ctcPerYear: 0 },
      statusType: '', actionType: '', effectiveDate: '', noteComment: '',
    }
  };

  // ── Forms ─────────────────────────────────────────────────────────────────
  profContactForm!: FormGroup;
  persContactForm!: FormGroup;
  commAddressForm!: FormGroup;
  permAddressForm!: FormGroup;
  iceForm!: FormGroup;
  personalProfForm!: FormGroup;
  spouseForm!: FormGroup;
  prevPFForm!: FormGroup;
  nativeForm!: FormGroup;
  healthForm!: FormGroup;
  idMarksForm!: FormGroup;
  languageForm!: FormGroup;
  familyMemberForm!: FormGroup;
  educationForm!: FormGroup;
  experienceForm!: FormGroup;
  referenceForm!: FormGroup;
  newCtcForm!: FormGroup;
  newEmpBasicForm!: FormGroup;
  profProfForm!: FormGroup;
  workLocationForm!: FormGroup;
  reportingOfficerForm!: FormGroup;
  profileForm!: FormGroup;
  expLevelForm!: FormGroup;
  transferForm!: FormGroup;
  transferActionForm!: FormGroup;
  hrActionForm!: FormGroup;

  // ── Options ───────────────────────────────────────────────────────────────
  relationOptions: any[] = [];
  maritalStatuses: any[] = [];
  nationalities: any[] = [];
  religions: any[] = [];
  languages: any[] = [];
  dobTypes: any[] = [];
  // ── Master data (API-loaded) ──────────────────────────────────────────────
  countries: any[] = [];
  relations: any[] = [];
  bloodGroups: any[] = [];
  educationTypes: any[] = [];
  universities: any[] = [];
  qualifications: any[] = [];
  educationBranches: any[] = [];
  isLoadingBranches = false;
  showBranchHint = false;
  private branchHintTimer: ReturnType<typeof setTimeout> | null = null;
  universitySearch = '';
  showUniversityDropdown = false;
  qualificationSearch = '';
  showQualificationDropdown = false;

  // ── Personal Info search-dropdown state ───────────────────────────────────
  nationalitySearch = ''; showNationalityDropdown = false;
  religionSearch = ''; showReligionDropdown = false;
  bloodGroupSearch = ''; showBloodGroupDropdown = false;
  spouseBloodGroupSearch = ''; showSpouseBloodGroupDropdown = false;
  nativeCountrySearch = ''; showNativeCountryDropdown = false;
  nativeStateSearch = ''; showNativeStateDropdown = false;
  nativeCitySearch = ''; showNativeCityDropdown = false;
  motherTongueSearch = ''; showMotherTongueDropdown = false;
  otherLanguageSearch = ''; showOtherLanguageDropdown = false;
  sectionStates: Record<string, any[]> = { prof: [], comm: [], perm: [], ice: [], native: [] };
  sectionCities: Record<string, any[]> = { prof: [], comm: [], perm: [], ice: [], native: [] };
  contactSearch: Record<string, { country: string; state: string; city: string }> = {
    prof: { country: '', state: '', city: '' },
    perm: { country: '', state: '', city: '' },
    ice: { country: '', state: '', city: '' },
  };
  contactDropdownOpen: Record<string, { country: boolean; state: boolean; city: boolean }> = {
    prof: { country: false, state: false, city: false },
    perm: { country: false, state: false, city: false },
    ice: { country: false, state: false, city: false },
  };
  genderOptions = ['Male', 'Female', 'Other'];
  educationLevelOpts = ['Entry Level', 'Upper Primary', 'Lower Primary', 'Secondary', 'Intermediate', 'Under Graduate', 'Post Graduate', 'Doctorate'];
  educationQualOpts = ['S.S.C', 'Intermediate', 'B.Tech', 'B.Com', 'B.Teach', 'M.Tech', 'MBA', 'M.Com', 'PhD'];
  educationBranchOpts = ['S.S.C', 'E.E.E', 'Commerce', 'Science', 'Arts', 'Computer Science', 'Mechanical', 'Civil'];
  educationTypeOpts = ['Regular', 'Distance', 'Part-Time'];
  industryTypes: any[] = [];
  functionalAreas: any[] = [];
  referenceTypeOpts = ['Internal', 'External'];
  locationOpts = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune'];
  financialYearOpts = ['Mar 2023 - Apr 2024', 'Mar 2024 - Apr 2025', 'Mar 2025 - Apr 2026'];
  payStructureOpts = ['HHC-Corporate', 'HHC-Plant', 'Contract'];
  statusTypeOpts = ['Draft', 'Final'];
  actionTypeOpts = ['Pending', 'Approved', 'Rejected'];
  employmentTypeOpts = ['Permanent', 'Contract', 'Consultant', 'Intern', 'Probation'];
  departmentOpts = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 'Quality', 'Admin'];
  designationOpts = ['Software Engineer', 'UI/UX Designer', 'QA Engineer', 'Project Manager', 'HR Manager', 'Finance Manager', 'Operations Manager', 'Admin Officer', 'Accountant', 'Other'];

  // ── Professional tab options ────────────────────────────────────────────────
  sectionOpts = ['Distribution', 'Information Technology', 'Finance', 'HR', 'Admin', 'Operations', 'Sales', 'Marketing'];
  paysheetGroupOpts = ['HHC-Corporate', 'HHC-Plant', 'Contract-Group', 'Other'];
  headQuarterOpts = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune'];
  regionOpts = ['--', 'South', 'North', 'East', 'West', 'Central'];
  termsOfServiceOpts = ['Doc_corp', 'Doc_plant', 'Contract', 'Permanent'];
  expLevelOpts = ['Entry Level', 'Junior', 'Mid Level', 'Mid Senior', 'Senior', 'Lead', 'Principal', 'Director'];
  incrementTypeOpts = ['Entry Level', 'Junior', 'Mid Level', 'Mid Senior', 'Senior', 'Lead', 'Principal'];

  // ── Transfer tab options ──────────────────────────────────────────────────
  transferTypeOpts = ['Internal', 'External', 'Deputation', 'Inter-Unit'];
  transferDetailsOpts = ['Promotion', 'Demotion', 'Lateral Move', 'Deputation', 'Inter-Department'];
  businessUnitOpts = ['HHC-Corporate', 'HHC-Plant', 'HHC-Retail', 'HHC-Distribution'];
  costCentreOpts = ['Office', 'Plant', 'Warehouse', 'Field', 'HQ'];
  reportingDateTimeOpts = ['Fore Noon', 'After Noon', 'Morning', 'Evening'];
  documentNoOpts: string[] = [];
  documentSourceOpts = ['E-Mail', 'Letter', 'Portal', 'Verbal', 'Other'];
  transferStatusOpts = ['HHC-Corporate', 'HHC-Plant', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

  // ── HR Actions tab options ────────────────────────────────────────────────
  hrActionCategoryOpts = ['Full & Final Settlement', 'Termination', 'Resignation Acceptance', 'Disciplinary Action', 'Promotion', 'Demotion', 'Warning Letter', 'Other'];

  // ── Contact view data ─────────────────────────────────────────────────────
  contactData = {
    professional: {
      phone: '', ext: '', mobileNumber: '', emailAddress: '',
      addressLane1: '', addressLane2: '', country: '', state: '', city: '', pinCode: '',
    },
    personal: { phone: '', ext: '', mobileNumber: '', emailAddress: '' },
    commAddress: {
      addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '',
      country: '', state: '', city: '', pinCode: '',
    },
    permAddress: {
      sameAsCurrent: false,
      addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '',
      country: '', state: '', city: '', pinCode: '',
    },
    ice: {
      relation: '', firstName: '', lastName: '', phone: '', ext: '',
      mobileNumber: '', emailAddress: '', addressMode: 'custom',
      addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '',
      country: '', state: '', city: '', pinCode: '',
    },
  };

  personalData = {
    professional: { nationality: '', religion: '', bloodGroup: '', maritalStatus: '', marriageAnniversary: '' },
    spouse: { fullName: '', bloodGroup: '', occupation: '', dateOfBirth: '', isDependent: false, isPFNominee: false },
    prevPF: { exist: 'No', uanNo: '', pfNo: '', bankName: '', ifsc: '', accountNo: '' },
    native: {
      country: '', state: '', city: '', placeOfBirth: '', dclAs: '', dateOfBirth: '',
      addressLane1: '', passportNo: '', pfanCardNo: '', drivingLicenseNo: '',
      aadharCardNo: '', aadharUID: '', nameOnAadhar: '',
    },
    health: {
      heightCms: null as any, weightKgs: null as any, majorSurgery: 'No',
      powerOfGlassLeft: '', powerOfGlassRight: '', convictedCourt: 'No', professionalBodyMembership: 'No',
    },
    idMarks: { id1: '', id2: '' },
    languageList: [] as any[],
  };

  private readonly masterData = inject(MasterDataService);
  private readonly contactSvc = inject(ContactService);
  private readonly toastr = inject(ToastService);

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    this.isNew = paramId === null;
    if (this.isNew) {
      this.employee = { id: 0, empId: '', fullName: 'New Employee', gender: '' as any, dob: '', doj: '', employmentType: '' as any, designation: '', department: '', setupProgress: 0, status: 'Active', initials: 'NE', avatarColor: '#6b7280' };
      this.resetAllDataToBlank();
    } else {
      const numericId = paramId ? parseInt(paramId.replace(/\D/g, ''), 10) : NaN;
      this.currentEmpId = isNaN(numericId) ? this.currentEmpId : numericId;
      const _colors = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2', '#9333ea', '#16a34a'];
      const _fallbackInitials = (paramId || '').replace(/\d/g, '').slice(0, 2).toUpperCase() || (paramId || '').slice(0, 2).toUpperCase();
      this.employee = { id: this.currentEmpId, empId: paramId || '', fullName: '', gender: '' as any, dob: '', doj: '', employmentType: '' as any, designation: '', department: '', setupProgress: 0, status: 'Active', initials: _fallbackInitials, avatarColor: _colors[this.currentEmpId % _colors.length] };
      try {
        const raw = JSON.parse(sessionStorage.getItem('selectedEmployee') || 'null');
        if (raw) {
          const name: string = raw['Full Name'] || raw['Emp Name'] || raw['Employee Name'] || raw['Name'] || raw.employeeName || raw.fullName || raw.name || '';
          const initials = name
            ? name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            : _fallbackInitials;
          this.employee = {
            ...this.employee,
            fullName: name,
            initials,
            picture: raw['Pic'] || raw.pic || raw.picture || raw.profilePic || '',
            designation: raw['Designation'] || raw.designation || '',
            department: raw['Department'] || raw.department || '',
            employmentType: raw['Employment Type'] || raw['EmploymentType'] || raw.employmentType || '',
            doj: raw['DOJ'] || raw['Date of Join'] || raw['Date Of Joining'] || raw.doj || '',
            dob: raw['DOB'] || raw['Date of Birth'] || raw.dob || '',
            gender: raw['Gender'] || raw.gender || '',
            status: raw['Status'] || raw.status || 'Active',
          };
        }
      } catch { /* ignore */ }
      this.resetAllDataToBlank();
    }
    this.buildForms();
    this.buildEducationForm();
    this.buildExperienceForm();
    this.buildReferenceForm();
    this.buildNewCtcForm();
    this.buildProfessionalForms();
    this.buildTransferForm();
    this.buildHrActionForm();
    this.loadMasterData();
    if (this.isNew) {
      this.buildNewEmpBasicForm();
      const newModeSections = ['profContact', 'persContact', 'commAddress', 'permAddress', 'ice', 'personalProf', 'spouse', 'prevPF', 'native', 'health', 'idMarks', 'language'];
      newModeSections.forEach(s => this.editing[s] = true);
    } else {
      this.loadContactDetails();
      this.loadFamilyDetails();
      this.loadPersonalDetails();
      this.loadEducationDetails();
      this.loadExperienceDetails();
    }
    this.getPersonalDetails();
  }

  private loadMasterData(): void {
    this.masterData.getCountries().subscribe({ next: d => this.countries = d || [], error: () => { } });
    this.masterData.getRelations().subscribe({ next: d => { this.relations = d || []; this.relationOptions = d || []; }, error: () => { } });
    this.masterData.getBloodGroups().subscribe({ next: d => this.bloodGroups = d || [], error: () => { } });
    this.masterData.getEducationTypes().subscribe({ next: d => this.educationTypes = d || [], error: () => { } });
    this.masterData.getUniversities().subscribe({ next: d => this.universities = d || [], error: () => { } });
    this.contactSvc.getQualifications().pipe(takeUntil(this.destroy$)).subscribe({ next: (d: any) => this.qualifications = Array.isArray(d) ? d : [], error: () => { } });
    this.masterData.getIndustry().subscribe({ next: d => this.industryTypes = d || [], error: () => { } });
    this.masterData.getFunctionalArea().subscribe({ next: d => this.functionalAreas = d || [], error: () => { } });
    this.masterData.getNationality().subscribe({ next: d => this.nationalities = d || [], error: () => { } });
    this.masterData.getReligion().subscribe({ next: d => this.religions = d || [], error: () => { } });
    this.masterData.getLanguages().subscribe({ next: d => this.languages = d || [], error: () => { } });
    this.masterData.getDobType().subscribe({ next: d => this.dobTypes = d || [], error: () => { } });
    this.masterData.getMaritalStatus().subscribe({ next: d => this.maritalStatuses = d || [], error: () => { } });
  }

  private loadBranchesForQualification(qualId: string): void {
    if (!qualId) { this.educationBranches = []; return; }
    this.isLoadingBranches = true;
    this.showBranchHint = false;
    if (this.branchHintTimer) { clearTimeout(this.branchHintTimer); this.branchHintTimer = null; }
    this.educationForm.get('branchId')?.disable();
    this.contactSvc.getbranches(qualId).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isLoadingBranches = false; })
    ).subscribe({
      next: (d: any) => {
        this.educationBranches = Array.isArray(d) ? d : [];
        if (this.educationBranches.length > 0) {
          this.educationForm.get('branchId')?.enable();
        } else {
          // Show hint for 10 s, then auto-hide to avoid layout disruption
          this.showBranchHint = true;
          this.branchHintTimer = setTimeout(() => { this.showBranchHint = false; }, 1000);
        }
      },
      error: () => { this.educationBranches = []; }
    });
  }

  onEducationQualificationChange(): void {
    const qualId = this.educationForm.get('qualificationId')?.value;
    this.educationForm.patchValue({ branchId: null });
    this.educationBranches = [];
    this.showBranchHint = false;
    if (this.branchHintTimer) { clearTimeout(this.branchHintTimer); this.branchHintTimer = null; }
    if (qualId) {
      this.loadBranchesForQualification(qualId);
    } else {
      this.educationForm.get('branchId')?.disable();
    }
  }

  // ── University typeahead ──────────────────────────────────────────────────
  get filteredUniversities(): any[] {
    const q = this.universitySearch.trim().toLowerCase();
    return q
      ? this.universities.filter(u => u.universityName?.toLowerCase().includes(q))
      : this.universities.slice(0, 60);
  }

  selectUniversity(u: any): void {
    this.educationForm.patchValue({ universityId: u.universityId });
    this.universitySearch = u.universityName;
    this.showUniversityDropdown = false;
  }

  clearUniversity(): void {
    this.educationForm.patchValue({ universityId: null });
    this.universitySearch = '';
    this.showUniversityDropdown = false;
  }

  onUniversityInput(event: Event): void {
    this.universitySearch = (event.target as HTMLInputElement).value;
    this.educationForm.patchValue({ universityId: null });
    this.showUniversityDropdown = true;
  }

  hideUniversityDropdownSoon(): void {
    setTimeout(() => {
      this.showUniversityDropdown = false;
      const selId = this.educationForm.get('universityId')?.value;
      if (selId) {
        const m = this.universities.find(u => u.universityId == selId);
        this.universitySearch = m?.universityName || '';
      } else {
        this.universitySearch = '';
      }
    }, 200);
  }

  // ── Personal Info search-dropdown helpers ─────────────────────────────────
  private filterList(list: any[], search: string, nameKey: string): any[] {
    const q = search.trim().toLowerCase();
    return q ? list.filter(i => i[nameKey]?.toLowerCase().includes(q)) : list.slice(0, 60);
  }
  // — Nationality
  get filteredNationalities(): any[] { return this.filterList(this.nationalities, this.nationalitySearch, 'nationalityName'); }
  onNationalityInput(e: Event): void { this.nationalitySearch = (e.target as HTMLInputElement).value; this.personalProfForm.patchValue({ nationality: '' }); this.showNationalityDropdown = true; }
  selectNationality(n: any): void { this.personalProfForm.patchValue({ nationality: String(n.nationalityId) }); this.nationalitySearch = n.nationalityName; this.showNationalityDropdown = false; }
  clearNationality(): void { this.personalProfForm.patchValue({ nationality: '' }); this.nationalitySearch = ''; this.showNationalityDropdown = false; }
  hideNationalityDropdownSoon(): void { setTimeout(() => { this.showNationalityDropdown = false; const v = this.personalProfForm.get('nationality')?.value; this.nationalitySearch = v ? this.nationalities.find(n => String(n.nationalityId) === String(v))?.nationalityName || '' : ''; }, 200); }

  // — Religion
  get filteredReligions(): any[] { return this.filterList(this.religions, this.religionSearch, 'religionName'); }
  onReligionInput(e: Event): void { this.religionSearch = (e.target as HTMLInputElement).value; this.personalProfForm.patchValue({ religion: '' }); this.showReligionDropdown = true; }
  selectReligion(r: any): void { this.personalProfForm.patchValue({ religion: String(r.religionId) }); this.religionSearch = r.religionName; this.showReligionDropdown = false; }
  clearReligion(): void { this.personalProfForm.patchValue({ religion: '' }); this.religionSearch = ''; this.showReligionDropdown = false; }
  hideReligionDropdownSoon(): void { setTimeout(() => { this.showReligionDropdown = false; const v = this.personalProfForm.get('religion')?.value; this.religionSearch = v ? this.religions.find(r => String(r.religionId) === String(v))?.religionName || '' : ''; }, 200); }

  // — Blood Group (personal)
  get filteredBloodGroups(): any[] { return this.filterList(this.bloodGroups, this.bloodGroupSearch, 'bloodGroupName'); }
  onBloodGroupInput(e: Event): void { this.bloodGroupSearch = (e.target as HTMLInputElement).value; this.personalProfForm.patchValue({ bloodGroup: '' }); this.showBloodGroupDropdown = true; }
  selectBloodGroup(b: any): void { this.personalProfForm.patchValue({ bloodGroup: String(b.bloodGroupId) }); this.bloodGroupSearch = b.bloodGroupName; this.showBloodGroupDropdown = false; }
  clearBloodGroup(): void { this.personalProfForm.patchValue({ bloodGroup: '' }); this.bloodGroupSearch = ''; this.showBloodGroupDropdown = false; }
  hideBloodGroupDropdownSoon(): void { setTimeout(() => { this.showBloodGroupDropdown = false; const v = this.personalProfForm.get('bloodGroup')?.value; this.bloodGroupSearch = v ? this.bloodGroups.find(b => String(b.bloodGroupId) === String(v))?.bloodGroupName || '' : ''; }, 200); }

  // — Blood Group (spouse)
  get filteredSpouseBloodGroups(): any[] { return this.filterList(this.bloodGroups, this.spouseBloodGroupSearch, 'bloodGroupName'); }
  onSpouseBloodGroupInput(e: Event): void { this.spouseBloodGroupSearch = (e.target as HTMLInputElement).value; this.spouseForm.patchValue({ bloodGroup: '' }); this.showSpouseBloodGroupDropdown = true; }
  selectSpouseBloodGroup(b: any): void { this.spouseForm.patchValue({ bloodGroup: String(b.bloodGroupId) }); this.spouseBloodGroupSearch = b.bloodGroupName; this.showSpouseBloodGroupDropdown = false; }
  clearSpouseBloodGroup(): void { this.spouseForm.patchValue({ bloodGroup: '' }); this.spouseBloodGroupSearch = ''; this.showSpouseBloodGroupDropdown = false; }
  hideSpouseBloodGroupDropdownSoon(): void { setTimeout(() => { this.showSpouseBloodGroupDropdown = false; const v = this.spouseForm.get('bloodGroup')?.value; this.spouseBloodGroupSearch = v ? this.bloodGroups.find(b => String(b.bloodGroupId) === String(v))?.bloodGroupName || '' : ''; }, 200); }

  // — Native Country
  get filteredNativeCountries(): any[] { return this.filterList(this.countries, this.nativeCountrySearch, 'countryName'); }
  onNativeCountryInput(e: Event): void { this.nativeCountrySearch = (e.target as HTMLInputElement).value; this.nativeForm.patchValue({ country: '', state: '', city: '' }); this.sectionStates['native'] = []; this.sectionCities['native'] = []; this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.showNativeCountryDropdown = true; }
  selectNativeCountry(c: any): void { this.nativeForm.patchValue({ country: String(c.countryId), state: '', city: '' }); this.nativeCountrySearch = c.countryName; this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.showNativeCountryDropdown = false; this.onCountryChange('native', c.countryId); }
  clearNativeCountry(): void { this.nativeForm.patchValue({ country: '', state: '', city: '' }); this.nativeCountrySearch = ''; this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.sectionStates['native'] = []; this.sectionCities['native'] = []; this.showNativeCountryDropdown = false; }
  hideNativeCountryDropdownSoon(): void { setTimeout(() => { this.showNativeCountryDropdown = false; const v = this.nativeForm.get('country')?.value; this.nativeCountrySearch = v ? this.countries.find(c => String(c.countryId) === String(v))?.countryName || '' : ''; }, 200); }

  // — Native State
  get filteredNativeStates(): any[] { return this.filterList(this.sectionStates['native'], this.nativeStateSearch, 'stateName'); }
  onNativeStateInput(e: Event): void { this.nativeStateSearch = (e.target as HTMLInputElement).value; this.nativeForm.patchValue({ state: '', city: '' }); this.sectionCities['native'] = []; this.nativeCitySearch = ''; this.showNativeStateDropdown = true; }
  selectNativeState(s: any): void { this.nativeForm.patchValue({ state: String(s.stateId), city: '' }); this.nativeStateSearch = s.stateName; this.nativeCitySearch = ''; this.showNativeStateDropdown = false; this.onStateChange('native', s.stateId); }
  clearNativeState(): void { this.nativeForm.patchValue({ state: '', city: '' }); this.nativeStateSearch = ''; this.nativeCitySearch = ''; this.sectionCities['native'] = []; this.showNativeStateDropdown = false; }
  hideNativeStateDropdownSoon(): void { setTimeout(() => { this.showNativeStateDropdown = false; const v = this.nativeForm.get('state')?.value; this.nativeStateSearch = v ? this.sectionStates['native'].find(s => String(s.stateId) === String(v))?.stateName || '' : ''; }, 200); }

  // — Native City
  get filteredNativeCities(): any[] { return this.filterList(this.sectionCities['native'], this.nativeCitySearch, 'cityName'); }
  onNativeCityInput(e: Event): void { this.nativeCitySearch = (e.target as HTMLInputElement).value; this.nativeForm.patchValue({ city: '' }); this.showNativeCityDropdown = true; }
  selectNativeCity(c: any): void { this.nativeForm.patchValue({ city: String(c.cityId) }); this.nativeCitySearch = c.cityName; this.showNativeCityDropdown = false; }
  clearNativeCity(): void { this.nativeForm.patchValue({ city: '' }); this.nativeCitySearch = ''; this.showNativeCityDropdown = false; }
  hideNativeCityDropdownSoon(): void { setTimeout(() => { this.showNativeCityDropdown = false; const v = this.nativeForm.get('city')?.value; this.nativeCitySearch = v ? this.sectionCities['native'].find(c => String(c.cityId) === String(v))?.cityName || '' : ''; }, 200); }

  // — Mother Tongue
  get filteredMotherTongues(): any[] { return this.filterList(this.languages, this.motherTongueSearch, 'languageName'); }
  onMotherTongueInput(e: Event): void { this.motherTongueSearch = (e.target as HTMLInputElement).value; this.languageForm.patchValue({ motherTongue: '' }); this.showMotherTongueDropdown = true; }
  selectMotherTongue(l: any): void { this.languageForm.patchValue({ motherTongue: String(l.languageId) }); this.motherTongueSearch = l.languageName; this.showMotherTongueDropdown = false; }
  clearMotherTongue(): void { this.languageForm.patchValue({ motherTongue: '' }); this.motherTongueSearch = ''; this.showMotherTongueDropdown = false; }
  hideMotherTongueDropdownSoon(): void { setTimeout(() => { this.showMotherTongueDropdown = false; const v = this.languageForm.get('motherTongue')?.value; this.motherTongueSearch = v ? this.languages.find(l => String(l.languageId) === String(v))?.languageName || '' : ''; }, 200); }

  // — Other Language
  get filteredOtherLanguages(): any[] { return this.filterList(this.languages, this.otherLanguageSearch, 'languageName'); }
  onOtherLanguageInput(e: Event): void { this.otherLanguageSearch = (e.target as HTMLInputElement).value; this.languageForm.patchValue({ otherLanguage: '' }); this.showOtherLanguageDropdown = true; }
  selectOtherLanguage(l: any): void { this.languageForm.patchValue({ otherLanguage: String(l.languageId) }); this.otherLanguageSearch = l.languageName; this.showOtherLanguageDropdown = false; }
  clearOtherLanguage(): void { this.languageForm.patchValue({ otherLanguage: '' }); this.otherLanguageSearch = ''; this.showOtherLanguageDropdown = false; }
  hideOtherLanguageDropdownSoon(): void { setTimeout(() => { this.showOtherLanguageDropdown = false; const v = this.languageForm.get('otherLanguage')?.value; this.otherLanguageSearch = v ? this.languages.find(l => String(l.languageId) === String(v))?.languageName || '' : ''; }, 200); }

  // ── Qualification typeahead ───────────────────────────────────────────────
  get filteredQualifications(): any[] {
    const q = this.qualificationSearch.trim().toLowerCase();
    return q
      ? this.qualifications.filter(ql => ql.qualificationName?.toLowerCase().includes(q))
      : this.qualifications.slice(0, 60);
  }

  selectQualification(ql: any): void {
    this.educationForm.patchValue({ qualificationId: String(ql.qualificationId) });
    this.qualificationSearch = ql.qualificationName;
    this.showQualificationDropdown = false;
    this.onEducationQualificationChange();
  }

  clearQualification(): void {
    this.educationForm.patchValue({ qualificationId: '' });
    this.qualificationSearch = '';
    this.showQualificationDropdown = false;
    this.educationBranches = [];
    this.educationForm.get('branchId')?.disable();
  }

  onQualificationInput(event: Event): void {
    this.qualificationSearch = (event.target as HTMLInputElement).value;
    this.educationForm.patchValue({ qualificationId: '' });
    this.showQualificationDropdown = true;
    this.educationBranches = [];
    this.educationForm.get('branchId')?.disable();
  }

  hideQualificationDropdownSoon(): void {
    setTimeout(() => {
      this.showQualificationDropdown = false;
      const selId = this.educationForm.get('qualificationId')?.value;
      if (selId) {
        const m = this.qualifications.find(q => q.qualificationId == selId);
        this.qualificationSearch = m?.qualificationName || '';
      } else {
        this.qualificationSearch = '';
      }
    }, 200);
  }

  getEducationTypeName(id: number | null): string {
    if (id == null) return '—';
    return this.educationTypes.find(e => e.educationTypeId == id)?.educationTypeName || String(id);
  }

  getUniversityName(id: number | null): string {
    if (id == null) return '—';
    return this.universities.find(u => u.universityId == id)?.universityName || '';
  }

  private loadContactDetails(): void {
    // Restore from cache immediately to avoid blank flash on re-visit
    const cacheKey = `contactCache_${this.currentEmpId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        this.mapContactResponse(JSON.parse(cached));
        this.buildForms();
        this.triggerCascadingLoads(JSON.parse(cached));
      }
    } catch { /* ignore */ }

    const formData = new FormData();
    formData.append('empId', String(this.currentEmpId));
    this.isLoading = true;
    this.contactSvc.getContactDetails(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!res) return;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
        this.mapContactResponse(res);
        this.buildForms();
        this.triggerCascadingLoads(res);
      },
      error: () => { this.isLoading = false; }
    });
  }
  private loadFamilyDetails(): void {
    const cacheKey = `familyCache_${this.currentEmpId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        this.mapFamilyApiResponse(JSON.parse(cached));
      }
    } catch { /* ignore */ }

    const formData = new FormData();
    formData.append('empId', String(this.currentEmpId));
    this.isLoading = true;
    this.contactSvc.getFamilyDetails(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!res) return;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
        this.mapFamilyApiResponse(res);
      },
      error: () => { this.isLoading = false; }
    });
  }

  private mapFamilyApiResponse(apiList: any[]): void {
    if (!Array.isArray(apiList)) return;
    const genderMap: Record<number, string> = { 1: 'Male', 2: 'Female', 3: 'Other' };
    this.familyMembers = apiList.map((item: any, i: number) => ({
      id: item.id ?? i + 1,
      relation: String(item.relation ?? ''),
      transactionId: item.transactionId ?? item.TransactionId ?? item.transactionID ?? item.transaction_id ?? null,
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      fullName: [item.firstName, item.lastName].filter(Boolean).join(' '),
      gender: genderMap[item.gender] || String(item.gender || ''),
      bloodGroup: item.bloodGroup != null ? String(item.bloodGroup) : '',
      dob: item.dateOfBirthStr || item.dateOfBirth || '',
      dateOfBirth: item.dateOfBirth ? String(item.dateOfBirth).split('T')[0] : '',
      age: item.age ?? 0,
      dateOfExpiry: item.dateOfExpireStr || item.dateOfExpire || '',
      dateOfExpire: item.dateOfExpire ? String(item.dateOfExpire).split('T')[0] : '',
      occupation: item.occupation || '',
      isPFNominee: !!item.isPfNominee,
      pfPercentage: item.pfPercentage ? parseFloat(String(item.pfPercentage)) : null,
      isGratuityNominee: !!item.isGratuityNominee,
      gratuityPercentage: item.gratuityPercentage ? parseFloat(String(item.gratuityPercentage)) : null,
      status: item.status ?? 1001,
    }));
  }

  private loadPersonalDetails(): void {
    const cacheKey = `personalCache_${this.currentEmpId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        this.mapPersonalResponse(JSON.parse(cached));
        this.buildForms();
      }
    } catch { /* ignore */ }

    const formData = new FormData();
    formData.append('empId', String(this.currentEmpId));
    this.contactSvc.getPersonalDetails(formData).subscribe({
      next: (res: any) => {
        if (!res) return;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
        this.mapPersonalResponse(res);
        this.buildForms();
        this.seedPersonalSearchLabels();
      },
      error: () => { }
    });
  }

  private seedPersonalSearchLabels(): void {
    const pp = this.personalData.professional;
    this.nationalitySearch = pp.nationality ? this.nationalities.find(n => String(n.nationalityId) === String(pp.nationality))?.nationalityName || '' : '';
    this.religionSearch = pp.religion ? this.religions.find(r => String(r.religionId) === String(pp.religion))?.religionName || '' : '';
    this.bloodGroupSearch = pp.bloodGroup ? this.bloodGroups.find(b => String(b.bloodGroupId) === String(pp.bloodGroup))?.bloodGroupName || '' : '';
    const sp = this.personalData.spouse;
    this.spouseBloodGroupSearch = sp.bloodGroup ? this.bloodGroups.find(b => String(b.bloodGroupId) === String(sp.bloodGroup))?.bloodGroupName || '' : '';
    const nd = this.personalData.native;
    this.nativeCountrySearch = nd.country ? this.countries.find(c => String(c.countryId) === String(nd.country))?.countryName || '' : '';
    this.nativeStateSearch = nd.state ? this.sectionStates['native'].find(s => String(s.stateId) === String(nd.state))?.stateName || '' : '';
    this.nativeCitySearch = nd.city ? this.sectionCities['native'].find(c => String(c.cityId) === String(nd.city))?.cityName || '' : '';
  }

  private mapPersonalResponse(res: any): void {
    if (res.personalInfo) {
      const pi = res.personalInfo;
      this.personalData.professional = {
        nationality: pi.nationality ?? this.personalData.professional.nationality,
        religion: pi.religion ?? this.personalData.professional.religion,
        bloodGroup: pi.blooGroup ?? pi.bloodGroup ?? this.personalData.professional.bloodGroup,
        maritalStatus: pi.maritalStatus || this.personalData.professional.maritalStatus,
        marriageAnniversary: pi.marriageAnniversary || this.personalData.professional.marriageAnniversary,
      };
    }

    if (res.previousPfInfo) {
      const pf = res.previousPfInfo;
      this.personalData.prevPF = {
        exist: pf.exist === 1 ? 'Yes' : 'No',
        uanNo: pf.uanNo || '',
        pfNo: pf.pfNo || '',
        bankName: pf.bankName || '',
        ifsc: pf.ifsc || '',
        accountNo: pf.accountNo || '',
      };
    }

    if (res.identityInfo) {
      const id = res.identityInfo;
      this.personalData.native = {
        country: String(id.country ?? ''),
        state: String(id.state ?? ''),
        city: String(id.city ?? ''),
        placeOfBirth: id.placeOfBirth || '',
        dclAs: id.dobAsPerType || '',
        dateOfBirth: id.dobAsPer ? String(id.dobAsPer).split('T')[0] : '',
        addressLane1: id.addressLane1 || '',
        passportNo: id.passportNo || '',
        pfanCardNo: id.pan || '',
        drivingLicenseNo: id.drivingLicenseNo && id.drivingLicenseNo !== 'undefined' ? id.drivingLicenseNo : '',
        aadharCardNo: id.aadhaarCardNo || '',
        aadharUID: id.aadhaarUid || '',
        nameOnAadhar: id.aadhaarName || '',
      };
      if (id.country) {
        this.masterData.getStates(Number(id.country)).subscribe({
          next: states => {
            this.sectionStates['native'] = states || [];
            if (id.state) {
              this.masterData.getCities(Number(id.state)).subscribe({
                next: cities => { this.sectionCities['native'] = cities || []; },
                error: () => { }
              });
            }
          },
          error: () => { }
        });
      }
    }

    if (res.healthInfo) {
      const hi = res.healthInfo;
      this.personalData.health = {
        heightCms: hi.height ?? null,
        weightKgs: hi.weight ?? null,
        majorSurgery: hi.anyMajorIssues || 'No',
        powerOfGlassLeft: hi.powerOfGlassLeft != null ? String(hi.powerOfGlassLeft) : '',
        powerOfGlassRight: hi.powerOfGlassRight != null ? String(hi.powerOfGlassRight) : '',
        convictedCourt: hi.courtOfLaw || 'No',
        professionalBodyMembership: hi.membership || 'No',
      };
    }

    if (Array.isArray(res.identificationMarksInfo) && res.identificationMarksInfo.length > 0) {
      const im = res.identificationMarksInfo[0];
      this.personalData.idMarks = {
        id1: im.identificationMarks1 || '',
        id2: im.identificationMarks2 || '',
      };
    }

    if (Array.isArray(res.languageInfo)) {
      this.personalData.languageList = res.languageInfo;
    }
  }

  private loadEducationDetails(): void {
    const cacheKey = `educationCache_${this.currentEmpId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) this.mapEducationApiResponse(JSON.parse(cached));
    } catch { /* ignore */ }

    const formData = new FormData();
    formData.append('empId', String(this.currentEmpId));
    this.contactSvc.getEducationDetails(formData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (!res) return;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
        this.mapEducationApiResponse(res);
      },
      error: () => { }
    });
  }

  private mapEducationApiResponse(apiList: any[]): void {
    if (!Array.isArray(apiList)) return;
    const eduTypeNameMap: Record<number, string> = { 1: 'Regular', 2: 'Distance', 3: 'Part-Time' };
    this.educationRecords = apiList.map((item: any, i: number) => ({
      id: item.id ?? i + 1,
      transactionId: item.transactionId ?? null,
      qualificationId: item.qualificationId || item.qualification || '',
      branchId: item.branchId || item.branch || null,
      institute: item.institute || item.instituteCollege || '',
      universityId: item.universityId ?? null,
      universityName: item.universityName || item.university || '',
      yearOfPassing: item.yearOfPassing ?? null,
      percentageOfMarks: item.percentageOfMarks != null ? parseFloat(String(item.percentageOfMarks)) : null,
      educationType: eduTypeNameMap[item.educationTypeId] || item.educationType || 'Regular',
      educationTypeId: item.educationTypeId ?? 1,
      isConsidered: item.isConsidered ?? 0,
      isWageReview: item.isWageReview ?? 0,
      isScale: item.isScale ?? 0,
      status: item.status ?? 1001,
    }));
  }
  getPersonalDetails(): void {
    const cacheKey = `personalCache_${this.currentEmpId}`;
    sessionStorage.removeItem(cacheKey);
    const formData = new FormData();
    formData.append('empId', String(this.currentEmpId));
    this.contactSvc.getPersonalDetails(formData).subscribe({
      next: (res: any) => {
        if (!res) return;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
        this.mapPersonalResponse(res);
        this.buildForms();
        this.seedPersonalSearchLabels();
      },
      error: () => { }
    });
  }

  private loadExperienceDetails(): void {
    const cacheKey = `experienceCache_${this.currentEmpId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) this.mapExperienceApiResponse(JSON.parse(cached));
    } catch { /* ignore */ }

    const formData = new FormData();
    formData.append('empId', String(this.currentEmpId));
    this.contactSvc.getExperienceDetails(formData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (!res) return;
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
        this.mapExperienceApiResponse(res);
      },
      error: () => { }
    });
  }

  private mapExperienceApiResponse(apiList: any[]): void {
    if (!Array.isArray(apiList)) return;
    this.experienceRecords = apiList.map((item: any, i: number) => {
      // Try to resolve qualificationId from the name using the loaded qualifications list
      const qualMatch = this.qualifications.find(q =>
        (q.qualificationName || '').toLowerCase() === (item.qualification || '').toLowerCase()
      );
      return {
        id: item.transactionId ?? i + 1,
        transactionId: item.transactionId ?? null,
        qualificationId: item.qualificationId != null ? String(item.qualificationId) : (qualMatch ? String(qualMatch.qualificationId) : null),
        qualification: item.qualification || '',
        branchId: item.branchId != null ? Number(item.branchId) : null,
        branch: item.branch || null,
        fromDate: item.fromDate || '',
        toDate: item.toDate || '',
        experienceMonths: item.experience ?? 0,
        isExperienceRelevant: item.isExperienceRelevant ?? 0,
        designation: item.designation || '',
        natureOfWork: item.natureOfWork || null,
        industryType: item.industryType ?? null,
        functionalArea: item.functionalArea ?? null,
        employerName: item.employerName || '',
        employerAddress: item.employerAddress || null,
        employerPhone: item.employerPhone || null,
        salaryPerMonth: item.salaryPerMonth != null ? parseFloat(String(item.salaryPerMonth)) : null,
        reasonForLeaving: item.reasonForLeaving || null,
        comments: item.comments || null,
        achievements: item.achievements || null,
        status: item.status ?? 1001,
      };
    });
  }

  private mapContactResponse(res: any): void {
    if (res.professionalContact) {
      const p = res.professionalContact;
      this.contactData.professional = {
        phone: p.phone || '', ext: String(p.ext || ''), mobileNumber: p.mobile || '',
        emailAddress: p.email || '', addressLane1: p.address1 || '',
        addressLane2: p.address2 || '', country: String(p.country || ''),
        state: String(p.state || ''), city: String(p.city || ''),
        pinCode: String(p.zip || ''),
      };
    }
    if (res.personalContact) {
      const pe = res.personalContact;
      this.contactData.personal = {
        phone: pe.phone || '', ext: String(pe.ext || ''),
        mobileNumber: pe.mobile || '', emailAddress: pe.email || '',
      };
      const addr = {
        addressLane1: pe.address1 || '', addressLane2: pe.address2 || '',
        addressLane3: '', addressLane4: '',
        country: String(pe.country || ''), state: String(pe.state || ''),
        city: String(pe.city || ''), pinCode: String(pe.zip || ''),
      };
      this.contactData.commAddress = { ...addr };
      // Default perm address to same as comm address
      this.contactData.permAddress = { sameAsCurrent: true, ...addr };
    }
    if (res.iceContact) {
      const ic = res.iceContact;
      this.contactData.ice = {
        ...this.contactData.ice,
        relation: String(ic.relation || ''),
        firstName: ic.firstName || '',
        lastName: ic.lastName || '',
        phone: ic.phone || '', ext: String(ic.ext || ''),
        mobileNumber: ic.mobile || '', emailAddress: ic.email || '',
        addressLane1: ic.add1 || '', addressLane2: ic.add2 || '',
        addressLane3: ic.add3 || '', addressLane4: ic.add4 || '',
        country: String(ic.country || ''), state: String(ic.state || ''),
        city: String(ic.city || ''), pinCode: String(ic.zip || ''),
      };
    }
  }

  private triggerCascadingLoads(res: any): void {
    const load = (section: string, countryId: any, stateId: any) => {
      if (!countryId) return;
      this.masterData.getStates(Number(countryId)).subscribe({
        next: states => {
          this.sectionStates[section] = states || [];
          if (stateId) {
            this.masterData.getCities(Number(stateId)).subscribe({
              next: cities => { this.sectionCities[section] = cities || []; },
              error: () => { }
            });
          }
        },
        error: () => { }
      });
    };
    if (res.professionalContact) {
      load('prof', res.professionalContact.country, res.professionalContact.state);
    }
    if (res.personalContact) {
      load('comm', res.personalContact.country, res.personalContact.state);
      load('perm', res.personalContact.country, res.personalContact.state);
    }
    if (res.iceContact) {
      load('ice', res.iceContact.country, res.iceContact.state);
    }
  }

  onCountryChange(section: string, countryId: number): void {
    this.sectionStates[section] = [];
    this.sectionCities[section] = [];
    if (!countryId) return;
    this.masterData.getStates(countryId).subscribe({
      next: d => { this.sectionStates[section] = d || []; },
      error: () => { }
    });
  }

  onStateChange(section: string, stateId: number): void {
    this.sectionCities[section] = [];
    if (!stateId) return;
    this.masterData.getCities(stateId).subscribe({
      next: d => { this.sectionCities[section] = d || []; },
      error: () => { }
    });
  }

  private buildPersonalPayload(): any {
    const pe = this.contactData.personal;
    const ca = this.contactData.commAddress;
    const pa = this.contactData.permAddress;
    return {
      userId: this.userId, empId: this.currentEmpId,
      email: pe.emailAddress || null, phone: pe.phone || null,
      ext: pe.ext ? Number(pe.ext) : null, mobile: pe.mobileNumber || null,
      perAdd1: pa.addressLane1 || null, perAdd2: pa.addressLane2 || null,
      perAdd3: pa.addressLane3 || null, perAdd4: pa.addressLane4 || null,
      pCity: pa.city ? parseInt(pa.city) : null, pZip: pa.pinCode ? parseInt(pa.pinCode) : null,
      comAdd1: ca.addressLane1 || null, comAdd2: ca.addressLane2 || null,
      comAdd3: ca.addressLane3 || null, comAdd4: ca.addressLane4 || null,
      cCity: ca.city ? parseInt(ca.city) : null, cZip: ca.pinCode ? parseInt(ca.pinCode) : null,
    };
  }

  private resetAllDataToBlank(): void {
    this.contactData = {
      professional: { phone: '', ext: '', mobileNumber: '', emailAddress: '', addressLane1: '', addressLane2: '', country: 'INDIA -IN', state: 'Telangana - TG', city: 'Hyderabad-HYD', pinCode: '' },
      personal: { phone: '', ext: '', mobileNumber: '', emailAddress: '' },
      commAddress: { addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '', country: 'INDIA -IN', state: 'Telangana - TG', city: 'Hyderabad-HYD', pinCode: '' },
      permAddress: { sameAsCurrent: false, addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '', country: 'INDIA -IN', state: 'Telangana - TG', city: 'Hyderabad-HYD', pinCode: '' },
      ice: { relation: '', firstName: '', lastName: '', phone: '', ext: '', mobileNumber: '', emailAddress: '', addressMode: 'custom', addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '', country: 'INDIA -IN', state: 'Telangana - TG', city: 'Hyderabad-HYD', pinCode: '' },
    };
    this.personalData = {
      professional: { nationality: 'INDIAN', religion: '', bloodGroup: '', maritalStatus: '', marriageAnniversary: '' },
      spouse: { fullName: '', bloodGroup: '', occupation: '', dateOfBirth: '', isDependent: false, isPFNominee: false },
      prevPF: { exist: 'No', uanNo: '', pfNo: '', bankName: '', ifsc: '', accountNo: '' },
      native: { country: 'INDIA -IN', state: '', city: '', placeOfBirth: '', dclAs: '', dateOfBirth: '', addressLane1: '', passportNo: '', pfanCardNo: '', drivingLicenseNo: '', aadharCardNo: '', aadharUID: '', nameOnAadhar: '' },
      health: { heightCms: null as any, weightKgs: null as any, majorSurgery: 'No', powerOfGlassLeft: '', powerOfGlassRight: '', convictedCourt: 'No', professionalBodyMembership: 'No' },
      idMarks: { id1: '', id2: '' },
      languageList: [] as any[],
    };
    this.familyMembers = [];
    this.educationRecords = [];
    this.experienceRecords = [];
    this.referenceRecords = [];
    this.ctcData = {
      current: {
        financialYear: '', payStructure: 'HHC-Corporate', grossPerMonth: 0,
        earnings: { gross: 0, basic: 0, ca: 0, education: 0, hra: 0, kitAllow: 0, medicalAllow: 0, splAllow: 0, travelAllow: 0 },
        deductions: { pt: 0, pf: 0, esi: 0 },
        annualBenefits: { medicalPremium: 0, lta: 0, pf: 0, esi: 0, bonus: 0, annualBonus: 0, gratuity: 0, retentionBonus: 0, variablePay: 0, performanceLinkedBonus: 0 },
        totals: { totalEarnings: 0, totalDeductions: 0, totalAnnualBe: 0, netPerMonth: 0, grossPerMonth: 0, ctcPerMonth: 0, netPerYear: 0, grossPerYear: 0, ctcPerYear: 0 },
        statusType: 'Draft', actionType: 'Pending',
      },
      new: {
        financialYear: 'Mar 2025 - Apr 2026', payStructure: 'HHC-Corporate', proposedGrossPerMonth: '',
        esiCycleConsider: false,
        earnings: { gross: 0, basic: 0, ca: 0, education: 0, hra: 0, kitAllow: 0, medicalAllow: 0, splAllow: 0, travelAllow: 0 },
        deductions: { pt: 0, pf: 0, esi: 0 },
        annualBenefits: { medicalPremium: 0, lta: 0, pf: 0, esi: 0, bonus: 0, annualBonus: 0, gratuity: 0, retentionBonus: 0, variablePay: 0, performanceLinkedBonus: 0 },
        totals: { totalEarnings: 0, totalDeductions: 0, totalAnnualBe: 0, netPerMonth: 0, grossPerMonth: 0, ctcPerMonth: 0, netPerYear: 0, grossPerYear: 0, ctcPerYear: 0 },
        statusType: 'Draft', actionType: 'Pending', effectiveDate: '', noteComment: '',
      }
    };
  }

  private buildNewEmpBasicForm(): void {
    this.newEmpBasicForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      empId: [''],
      gender: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      doj: ['', [Validators.required]],
      employmentType: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      department: ['', [Validators.required]],
      status: ['Active', [Validators.required]],
    });
  }

  saveNewEmployee(): void {
    if (this.newEmpBasicForm) this.newEmpBasicForm.markAllAsTouched();
    if (this.newEmpBasicForm?.invalid) return;
    // In a real app, collect & POST all forms to API
    this.router.navigate(['/hrms/employees']);
  }

  private buildForms(): void {
    const required = Validators.required;
    const mobile10 = Validators.pattern(/^\d{10}$/);
    const pincode6 = Validators.pattern(/^\d{6}$/);
    const emailVal = Validators.email;

    const pc = this.contactData.professional;
    this.profContactForm = this.fb.group({
      phone: [pc.phone, [mobile10]],
      ext: [pc.ext, [Validators.pattern(/^\d{1,6}$/)]],
      mobileNumber: [pc.mobileNumber, [required, mobile10]],
      emailAddress: [pc.emailAddress, [required, emailVal]],
      addressLane1: [pc.addressLane1, [required]],
      addressLane2: [pc.addressLane2],
      country: [pc.country, [required]],
      state: [pc.state, [required]],
      city: [pc.city, [required]],
      pinCode: [pc.pinCode, [pincode6]],
    });
    const pe = this.contactData.personal;
    this.persContactForm = this.fb.group({
      phone: [pe.phone, [mobile10]],
      ext: [pe.ext, [Validators.pattern(/^\d{1,6}$/)]],
      mobileNumber: [pe.mobileNumber, [mobile10]],
      emailAddress: [pe.emailAddress, [emailVal]],
    });
    const ca = this.contactData.commAddress;
    this.commAddressForm = this.fb.group({
      addressLane1: [ca.addressLane1, [required]], addressLane2: [ca.addressLane2],
      addressLane3: [ca.addressLane3], addressLane4: [ca.addressLane4],
      country: [ca.country, [required]], state: [ca.state, [required]],
      city: [ca.city, [required]], pinCode: [ca.pinCode, [pincode6]],
    });
    const pa = this.contactData.permAddress;
    this.permAddressForm = this.fb.group({
      sameAsCurrent: [pa.sameAsCurrent],
      addressLane1: [pa.addressLane1, [required]],
      addressLane2: [pa.addressLane2],
      addressLane3: [pa.addressLane3],
      addressLane4: [pa.addressLane4],
      country: [pa.country, [required]],
      state: [pa.state, [required]],
      city: [pa.city, [required]],
      pinCode: [pa.pinCode, [pincode6]],
    });
    const ic = this.contactData.ice;
    this.iceForm = this.fb.group({
      relation: [ic.relation, [required]],
      firstName: [ic.firstName, [required]],
      lastName: [ic.lastName, [required]],
      phone: [ic.phone, [mobile10]],
      ext: [ic.ext, [Validators.pattern(/^\d{1,6}$/)]],
      mobileNumber: [ic.mobileNumber, [mobile10]],
      emailAddress: [ic.emailAddress, [emailVal]],
      addressMode: [ic.addressMode],
      addressLane1: [ic.addressLane1], addressLane2: [ic.addressLane2],
      addressLane3: [ic.addressLane3], addressLane4: [ic.addressLane4],
      country: [ic.country], state: [ic.state], city: [ic.city],
      pinCode: [ic.pinCode, [pincode6]],
    });
    const pp = this.personalData.professional;
    this.personalProfForm = this.fb.group({
      nationality: [pp.nationality, [required]], religion: [pp.religion, [required]],
      bloodGroup: [pp.bloodGroup, [required]], maritalStatus: [pp.maritalStatus, [required]],
      marriageAnniversary: [pp.marriageAnniversary],
    });
    const sp = this.personalData.spouse;
    this.spouseForm = this.fb.group({
      fullName: [sp.fullName, [required, Validators.minLength(2)]], bloodGroup: [sp.bloodGroup],
      occupation: [sp.occupation], dateOfBirth: [sp.dateOfBirth],
      isDependent: [sp.isDependent], isPFNominee: [sp.isPFNominee],
    });
    const pf = this.personalData.prevPF;
    this.prevPFForm = this.fb.group({
      exist: [pf.exist, [required]],
      uanNo: [pf.uanNo, [Validators.pattern(/^\d{12}$/)]],
      pfNo: [pf.pfNo],
      bankName: [pf.bankName],
      ifsc: [pf.ifsc, [Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/i)]],
      accountNo: [pf.accountNo],
    });
    const nd = this.personalData.native;
    this.nativeForm = this.fb.group({
      country: [nd.country, [required]],
      state: [nd.state, [required]],
      city: [nd.city, [required]],
      placeOfBirth: [nd.placeOfBirth, [required, Validators.pattern(/^[a-zA-Z ]+$/)]],
      dclAs: [nd.dclAs, [required]],
      dateOfBirth: [nd.dateOfBirth, [required]],
      addressLane1: [nd.addressLane1],
      passportNo: [nd.passportNo, [Validators.pattern(/^[A-Z]{1}[0-9]{7}$/i)]],
      pfanCardNo: [nd.pfanCardNo, [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i)]],
      drivingLicenseNo: [nd.drivingLicenseNo],
      aadharCardNo: [nd.aadharCardNo, [Validators.pattern(/^\d{12}$/)]],
      aadharUID: [nd.aadharUID, [Validators.pattern(/^\d{16}$/)]],
      nameOnAadhar: [nd.nameOnAadhar, [Validators.pattern(/^[a-zA-Z ]+$/)]],
    });
    const hi = this.personalData.health;
    this.healthForm = this.fb.group({
      heightCms: [hi.heightCms, [Validators.min(50), Validators.max(300)]],
      weightKgs: [hi.weightKgs, [Validators.min(10), Validators.max(500)]],
      majorSurgery: [hi.majorSurgery],
      powerOfGlassLeft: [hi.powerOfGlassLeft],
      powerOfGlassRight: [hi.powerOfGlassRight],
      convictedCourt: [hi.convictedCourt, [required]],
      professionalBodyMembership: [hi.professionalBodyMembership, [required]],
    });
    this.idMarksForm = this.fb.group({
      id1: [this.personalData.idMarks.id1, [Validators.maxLength(100)]],
      id2: [this.personalData.idMarks.id2, [Validators.maxLength(100)]],
    });
    this.buildFamilyForm();
  }

  private buildFamilyForm(member?: FamilyMember): void {
    this.familyMemberForm = this.fb.group({
      relation: [member?.relation || '', [Validators.required]],
      firstName: [member?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [member?.lastName || ''],
      gender: [member?.gender || '', [Validators.required]],
      bloodGroup: [member?.bloodGroup || ''],
      dob: [member?.dateOfBirth || '', [Validators.required]],
      dateOfExpire: [member?.dateOfExpire || ''],
      occupation: [member?.occupation || ''],
      isPFNominee: [member?.isPFNominee ?? false],
      pfPercentage: [member?.pfPercentage ?? null, [Validators.min(0), Validators.max(100)]],
      isGratuityNominee: [member?.isGratuityNominee ?? false],
      gratuityPercentage: [member?.gratuityPercentage ?? null, [Validators.min(0), Validators.max(100)]],
    });
    // Apply initial validators based on existing values (important when editing)
    this.syncPfValidators(this.familyMemberForm.get('isPFNominee')?.value);
    this.syncGratuityValidators(this.familyMemberForm.get('isGratuityNominee')?.value);
    // React to toggle changes
    this.familyMemberForm.get('isPFNominee')?.valueChanges
      .subscribe(val => this.syncPfValidators(val));
    this.familyMemberForm.get('isGratuityNominee')?.valueChanges
      .subscribe(val => this.syncGratuityValidators(val));
  }

  private syncPfValidators(on: boolean): void {
    const ctrl = this.familyMemberForm.get('pfPercentage');
    ctrl?.setValidators(on
      ? [Validators.required, Validators.min(0), Validators.max(100)]
      : [Validators.min(0), Validators.max(100)]);
    ctrl?.updateValueAndValidity({ emitEvent: false });
  }

  private syncGratuityValidators(on: boolean): void {
    const ctrl = this.familyMemberForm.get('gratuityPercentage');
    ctrl?.setValidators(on
      ? [Validators.required, Validators.min(0), Validators.max(100)]
      : [Validators.min(0), Validators.max(100)]);
    ctrl?.updateValueAndValidity({ emitEvent: false });
  }

  private buildEducationForm(rec?: EducationRecord): void {
    this.educationForm = this.fb.group({
      qualificationId: [rec?.qualificationId != null && rec.qualificationId !== '' ? String(rec.qualificationId) : '', [Validators.required]],
      branchId: [rec?.branchId ?? null],
      institute: [rec?.institute || '', [Validators.required]],
      universityId: [rec?.universityId ?? null],
      yearOfPassing: [
        rec?.yearOfPassing ? String(rec.yearOfPassing) : '',
        [Validators.required, Validators.pattern(/^\d{4}$/)],
      ],
      percentageOfMarks: [rec?.percentageOfMarks != null ? String(rec.percentageOfMarks) : '', [Validators.min(0), Validators.max(100)]],
      educationTypeId: [rec?.educationTypeId != null ? String(rec.educationTypeId) : null, [Validators.required]],
      isConsidered: [rec ? rec.isConsidered === 1 : false],
      isWageReview: [rec ? rec.isWageReview === 1 : false],
      isScale: [rec ? rec.isScale === 1 : false],
    });
    if (!rec?.qualificationId) {
      this.educationForm.get('branchId')?.disable();
    }
  }

  private buildExperienceForm(rec?: ExperienceRecord): void {
    const mobile10 = Validators.pattern(/^\d{10}$/);
    const existingBranchId = rec?.branchId ?? null;
    this.experienceForm = this.fb.group({
      qualificationId: [rec?.qualificationId || null, [Validators.required]],
      branchId: [{ value: existingBranchId, disabled: !rec?.qualificationId }],
      fromDate: [rec?.fromDate || '', [Validators.required]],
      toDate: [{ value: rec?.toDate || '', disabled: this.isCurrentlyWorking || !rec?.fromDate }],
      isExperienceRelevant: [rec?.isExperienceRelevant ?? 0, [Validators.required]],
      designation: [rec?.designation || '', [Validators.required, Validators.minLength(2), Validators.pattern(/^[^\s].*$/)]],
      natureOfWork: [rec?.natureOfWork || null],
      industryType: [rec?.industryType ?? null],
      functionalArea: [rec?.functionalArea ?? null],
      employerName: [rec?.employerName || '', [Validators.required, Validators.minLength(2), Validators.pattern(/^[^\s].*$/)]],
      employerAddress: [rec?.employerAddress || null],
      employerPhone: [rec?.employerPhone || null, [mobile10]],
      salaryPerMonth: [rec?.salaryPerMonth ?? null, [Validators.min(0)]],
      reasonForLeaving: [rec?.reasonForLeaving || null],
      comments: [rec?.comments || null],
      achievements: [rec?.achievements || null],
      status: [rec?.status ?? 1001, [Validators.required]],
    });
    // fromDate drives toDate enable/disable + recalc
    this.experienceForm.get('fromDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (!this.isCurrentlyWorking) {
        const toCtrl = this.experienceForm.get('toDate');
        if (val) {
          toCtrl?.enable();
        } else {
          toCtrl?.setValue(null);
          toCtrl?.disable();
          this.expDateOrderWarning = false;
        }
      }
      this.onExpDateChange();
    });
    this.experienceForm.get('toDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onExpDateChange());
    // Trigger immediately so duration shows on open (edit mode / currently-working)
    this.onExpDateChange();
  }

  private buildReferenceForm(rec?: ReferenceRecord): void {
    this.referenceForm = this.fb.group({
      referenceType: [rec?.referenceType || 'Internal', [Validators.required]],
      isRelative: [rec?.isRelative ?? false],
      referenceId: [rec?.referenceId || ''],
      name: [rec?.name || '', [Validators.required]],
      designation: [rec?.designation || ''],
      destination: [rec?.destination || ''],
      contactNumber: [rec?.contactNumber || ''],
      addressLane1: [rec?.addressLane1 || ''],
      addressLane2: [rec?.addressLane2 || ''],
      location: [rec?.location || ''],
      state: [rec?.state || ''],
      city: [rec?.city || ''],
      pincode: [rec?.pincode || '', [Validators.pattern(/^\d{6}$/)]],
      company: [rec?.company || ''],
      isRelevant: [rec?.isRelevant ?? false],
      status: [rec?.status || 'Active', [Validators.required]],
    });
  }

  private buildNewCtcForm(): void {
    const n = this.ctcData.new;
    this.newCtcForm = this.fb.group({
      financialYear: [n.financialYear],
      payStructure: [n.payStructure],
      proposedGrossPerMonth: [n.proposedGrossPerMonth],
      esiCycleConsider: [n.esiCycleConsider],
      statusType: [n.statusType, [Validators.required]],
      actionType: [n.actionType, [Validators.required]],
      effectiveDate: [n.effectiveDate],
      noteComment: [n.noteComment],
    });
  }

  // ── Country / State / City typeahead helpers ─────────────────────────────
  getFilteredCountries(section: string): any[] {
    const q = (this.contactSearch[section]?.country || '').trim().toLowerCase();
    return q ? this.countries.filter(c => c.countryName?.toLowerCase().includes(q)) : this.countries;
  }

  getFilteredStates(section: string): any[] {
    const q = (this.contactSearch[section]?.state || '').trim().toLowerCase();
    const states = this.sectionStates[section] || [];
    return q ? states.filter(s => s.stateName?.toLowerCase().includes(q)) : states;
  }

  getFilteredCities(section: string): any[] {
    const q = (this.contactSearch[section]?.city || '').trim().toLowerCase();
    const cities = this.sectionCities[section] || [];
    return q ? cities.filter(c => c.cityName?.toLowerCase().includes(q)) : cities;
  }

  selectCountry(section: string, c: any, form: FormGroup): void {
    form.patchValue({ country: c.countryId, state: '', city: '' });
    this.contactSearch[section].country = c.countryName;
    this.contactSearch[section].state = '';
    this.contactSearch[section].city = '';
    this.contactDropdownOpen[section].country = false;
    this.onCountryChange(section, c.countryId);
  }

  selectState(section: string, s: any, form: FormGroup): void {
    form.patchValue({ state: s.stateId, city: '' });
    this.contactSearch[section].state = s.stateName;
    this.contactSearch[section].city = '';
    this.contactDropdownOpen[section].state = false;
    this.onStateChange(section, s.stateId);
  }

  selectCity(section: string, c: any, form: FormGroup): void {
    form.patchValue({ city: c.cityId });
    this.contactSearch[section].city = c.cityName;
    this.contactDropdownOpen[section].city = false;
  }

  onContactSearchInput(section: string, field: 'country' | 'state' | 'city', event: Event): void {
    this.contactSearch[section][field] = (event.target as HTMLInputElement).value;
    this.contactDropdownOpen[section][field] = true;
  }

  hideContactDropdown(section: string, field: 'country' | 'state' | 'city'): void {
    setTimeout(() => {
      this.contactDropdownOpen[section][field] = false;
      const form = this.getContactForm(section);
      form.get(field)?.markAsTouched();
      const selId = form.get(field)?.value;
      if (selId) {
        if (field === 'country') {
          const m = this.countries.find(c => c.countryId == selId);
          this.contactSearch[section].country = m?.countryName || '';
        } else if (field === 'state') {
          const m = (this.sectionStates[section] || []).find((s: any) => s.stateId == selId);
          this.contactSearch[section].state = m?.stateName || '';
        } else {
          const m = (this.sectionCities[section] || []).find((c: any) => c.cityId == selId);
          this.contactSearch[section].city = m?.cityName || '';
        }
      } else {
        this.contactSearch[section][field] = '';
      }
    }, 200);
  }

  private getContactForm(section: string): FormGroup {
    if (section === 'prof') return this.profContactForm;
    if (section === 'perm') return this.permAddressForm;
    return this.iceForm;
  }

  clearContactField(section: string, field: 'country' | 'state' | 'city', form: FormGroup): void {
    this.contactSearch[section][field] = '';
    if (field === 'country') {
      form.patchValue({ country: '', state: '', city: '' });
      this.contactSearch[section].state = '';
      this.contactSearch[section].city = '';
      this.sectionStates[section] = [];
      this.sectionCities[section] = [];
    } else if (field === 'state') {
      form.patchValue({ state: '', city: '' });
      this.contactSearch[section].city = '';
      this.sectionCities[section] = [];
    } else {
      form.patchValue({ city: '' });
    }
  }

  private initContactSearchText(section: string, form: FormGroup): void {
    const cId = form.get('country')?.value;
    const sId = form.get('state')?.value;
    const cityId = form.get('city')?.value;
    this.contactSearch[section] = {
      country: cId ? (this.countries.find(c => c.countryId == cId)?.countryName || '') : '',
      state: sId ? ((this.sectionStates[section] || []).find(s => s.stateId == sId)?.stateName || '') : '',
      city: cityId ? ((this.sectionCities[section] || []).find(c => c.cityId == cityId)?.cityName || '') : '',
    };
  }

  // ── Edit / Save helpers ───────────────────────────────────────────────────
  startEdit(section: string): void {
    this.editing[section] = true;
    if (section === 'profContact') this.initContactSearchText('prof', this.profContactForm);
    if (section === 'permAddress') this.initContactSearchText('perm', this.permAddressForm);
    if (section === 'ice') this.initContactSearchText('ice', this.iceForm);
  }
  cancelEdit(section: string): void { this.editing[section] = false; }

  saveProfContact(): void {
    if (this.profContactForm.invalid) { this.profContactForm.markAllAsTouched(); return; }
    Object.assign(this.contactData.professional, this.profContactForm.value);
    this.editing['profContact'] = false;
    const pc = this.contactData.professional;
    const payload = {
      userId: this.userId, empId: this.currentEmpId,
      email: pc.emailAddress || null, phone: pc.phone || null,
      ext: pc.ext ? Number(pc.ext) : null, mobile: pc.mobileNumber || null,
      address1: pc.addressLane1 || null, address2: pc.addressLane2 || null,
      city: pc.city ? parseInt(pc.city) : null, zip: pc.pinCode ? parseInt(pc.pinCode) : null,
    };
    this.contactSvc.updateProfessionalContact(payload).subscribe({ next: () => { }, error: () => { } });
  }
  savePersContact(): void {
    if (this.persContactForm.invalid) { this.persContactForm.markAllAsTouched(); return; }
    Object.assign(this.contactData.personal, this.persContactForm.value);
    this.editing['persContact'] = false;
    this.contactSvc.updatePersonalContact(this.buildPersonalPayload()).subscribe({ next: () => { }, error: () => { } });
  }
  saveCommAddress(): void {
    if (this.commAddressForm.invalid) { this.commAddressForm.markAllAsTouched(); return; }
    Object.assign(this.contactData.commAddress, this.commAddressForm.value);
    this.editing['commAddress'] = false;
    this.contactSvc.updatePersonalContact(this.buildPersonalPayload()).subscribe({ next: () => { }, error: () => { } });
  }
  savePermAddress(): void {
    if (this.permAddressForm.invalid) { this.permAddressForm.markAllAsTouched(); return; }
    Object.assign(this.contactData.permAddress, this.permAddressForm.value);
    this.editing['permAddress'] = false;
    this.contactSvc.updatePersonalContact(this.buildPersonalPayload()).subscribe({ next: () => { }, error: () => { } });
  }
  saveIce(): void {
    if (this.iceForm.invalid) { this.iceForm.markAllAsTouched(); return; }
    Object.assign(this.contactData.ice, this.iceForm.value);
    this.editing['ice'] = false;
    const ic = this.contactData.ice;
    const payload = {
      userId: this.userId, empId: this.currentEmpId,
      firstName: ic.firstName || null, lastName: ic.lastName || null,
      relation: ic.relation ? Number(ic.relation) : null,
      email: ic.emailAddress || null, phone: ic.phone || null,
      ext: ic.ext ? Number(ic.ext) : null, mobile: ic.mobileNumber || null,
      add1: ic.addressLane1 || null, add2: ic.addressLane2 || null,
      add3: ic.addressLane3 || null, add4: ic.addressLane4 || null,
      city: ic.city ? parseInt(ic.city) : null, zip: ic.pinCode ? parseInt(ic.pinCode) : null,
    };
    this.contactSvc.updateIceContact(payload).subscribe({ next: () => { }, error: () => { } });
  }
  savePersonalProf(): void {
    if (this.personalProfForm.invalid) { this.personalProfForm.markAllAsTouched(); return; }
    // Object.assign(this.personalData.professional, this.personalProfForm.value);
    // this.editing['personalProf'] = false;
    const payload = {
      userId: this.userId,
      empId: this.currentEmpId,
      nationality: Number(this.personalProfForm.value.nationality),
      bloodGroup: this.personalProfForm.value.bloodGroup
        ? Number(this.personalProfForm.value.bloodGroup)
        : null,
      religion: Number(this.personalProfForm.value.religion),
      maritalStatus: this.personalProfForm.value.maritalStatus
    };

    this.contactSvc.updatePersonalDetails(payload).subscribe({
      next: (res) => {
        this.editing['personalProf'] = false;
        this.getPersonalDetails();
      },
      error: err => {
      console.error(err);
      this.toastr.error(err.error || 'Failed to update Personal details');
    }
    });
  }
  saveSpouse(): void {
    if (this.spouseForm.invalid) { this.spouseForm.markAllAsTouched(); return; }
    Object.assign(this.personalData.spouse, this.spouseForm.value);
    this.editing['spouse'] = false;
  }
  savePrevPF(): void {
    if (this.prevPFForm.invalid) { this.prevPFForm.markAllAsTouched(); return; }
    // Object.assign(this.personalData.prevPF, this.prevPFForm.value);
    // this.editing['prevPF'] = false;
      const payload = {
    userId: this.userId,
    empId: this.currentEmpId,
    exist: this.prevPFForm.value.exist === 'Yes' ? 1 : 2,
    uanNo: this.prevPFForm.value.uanNo,
    pfNo: this.prevPFForm.value.pfNo,
    bankName: this.prevPFForm.value.bankName,
    ifsc: this.prevPFForm.value.ifsc,
    accountNo: this.prevPFForm.value.accountNo
  };

  this.contactSvc.updatePreviousPfDetails(payload).subscribe({
    next: () => {
      this.toastr.success('Previous PF details updated successfully');
      this.editing['prevPF'] = false;
      this.getPersonalDetails();
    },
    error: err => {
      console.error(err);
      this.toastr.error(err.error || 'Failed to update Previous PF details');
    }
  });
  }
  saveNative(): void {
    if (this.nativeForm.invalid) { this.nativeForm.markAllAsTouched(); return; }
    // Object.assign(this.personalData.native, this.nativeForm.value);
    // this.editing['native'] = false;
     const payload = {
    userId: this.userId,
    empId: this.currentEmpId,
    city: Number(this.nativeForm.value.city),
    state: Number(this.nativeForm.value.state),
    country: Number(this.nativeForm.value.country),
    placeOfBirth: this.nativeForm.value.placeOfBirth,
    dobAsPerType: this.nativeForm.value.dclAs,
    dobAsPer: this.nativeForm.value.dateOfBirth,
    passportNo: this.nativeForm.value.passportNo,
    pan: this.nativeForm.value.pfanCardNo,
    drivingLicenseNo: this.nativeForm.value.drivingLicenseNo,
    aadhaarCardNo: this.nativeForm.value.aadharCardNo,
    aadhaarUid: this.nativeForm.value.aadharUID,
    aadhaarName: this.nativeForm.value.nameOnAadhar
  };

  this.contactSvc.updateIdentityDetails(payload).subscribe({
    next: () => {
      this.toastr.success('Identity details updated successfully');
      this.editing['native'] = false;
      this.getPersonalDetails();
    },
    error: err => {
      console.error(err);
      this.toastr.error(err.error || 'Failed to update Identity details');
    }
  });
  }
  saveHealth(): void {
    if (this.healthForm.invalid) { this.healthForm.markAllAsTouched(); return; }
    // Object.assign(this.personalData.health, this.healthForm.value);
    // this.editing['health'] = false;
     const payload = {
    userId: this.userId,
    empId: this.currentEmpId,
    height: this.healthForm.value.heightCms,
    weight: this.healthForm.value.weightKgs,
    powerOfGlassRight: this.healthForm.value.powerOfGlassRight,
    powerOfGlassLeft: this.healthForm.value.powerOfGlassLeft,
    anyMajorIssues: this.healthForm.value.majorSurgery,
    membership: this.healthForm.value.professionalBodyMembership,
    courtOfLaw: this.healthForm.value.convictedCourt
  };

  this.contactSvc.updateHealthDetails(payload).subscribe({
    next: () => {
      this.toastr.success('Health details updated successfully');
      this.editing['health'] = false;
      this.getPersonalDetails();
    },
    error: err => {
      console.error(err);
      this.toastr.error(err.error || 'Failed to update health details');
    }
  });
  }
  saveIdMarks(): void {
    if (this.idMarksForm.invalid) { this.idMarksForm.markAllAsTouched(); return; }
    // Object.assign(this.personalData.idMarks, this.idMarksForm.value);
    // this.editing['idMarks'] = false;
     const payload = {
    userId: this.userId,
    empId: this.currentEmpId,
    identificationMarks1: this.idMarksForm.value.id1,
    identificationMarks2: this.idMarksForm.value.id2
  };

  this.contactSvc.updateIdentificationMarksDetails(payload).subscribe({
    next: () => {
      this.toastr.success('Identification Marks updated successfully');
      this.editing['idMarks'] = false;
      this.getPersonalDetails();
    },
    error: err => {
      console.error(err);
      this.toastr.error(err.error || 'Failed to update Identification Marks');
    }
  });
  }
  addLanguage(data: { languageId: number; canRead: number; canWrite: number; canSpeak: number }): void {
    const payload = { userId: this.userId, empId: this.currentEmpId, ...data };
    this.contactSvc.addLanguageDetails(payload).subscribe({
      next: () => { this.toastr.success('Language added successfully'); this.getPersonalDetails(); },
      error: err => { this.toastr.error(err.error || 'Failed to add language'); },
    });
  }

  deleteLanguage(languageId: number): void {
    this.contactSvc.deactivateLanguageDetails(this.userId, this.currentEmpId, languageId).subscribe({
      next: () => { this.toastr.success('Language removed successfully'); this.getPersonalDetails(); },
      error: err => { this.toastr.error(err.error || 'Failed to remove language'); },
    });
  }

  // ── Family ────────────────────────────────────────────────────────────────
  openAddFamily(): void { this.editingFamilyMemberId = null; this.editingOriginalRelation = ''; this.buildFamilyForm(); this.familySaveError = null; this.showFamilyModal = true; }
  editFamilyMember(m: FamilyMember): void { this.editingFamilyMemberId = m.id; this.editingOriginalRelation = m.relation; this.buildFamilyForm(m); this.familySaveError = null; this.showFamilyModal = true; }
  closeFamilyModal(): void { if (this.isFamilySaving) return; this.showFamilyModal = false; }

  saveFamilyMember(): void {
    if (this.familyMemberForm.invalid) { this.familyMemberForm.markAllAsTouched(); return; }
    if (this.isFamilySaving) return;

    const v = this.familyMemberForm.value;
    const genderMap: Record<string, number> = { Male: 1, Female: 2, Other: 3 };
    const isEdit = this.editingFamilyMemberId !== null;

    const relationChanged = isEdit && String(v.relation) !== String(this.editingOriginalRelation);

    const payload: any = {
      userId: this.userId,
      empId: this.currentEmpId,
      relation: isEdit ? Number(this.editingOriginalRelation) : Number(v.relation),
      newRelation: isEdit ? (relationChanged ? Number(v.relation) : null) : null,
      firstName: v.firstName || '',
      lastName: v.lastName || '',
      gender: genderMap[v.gender] ?? 0,
      bloodGroup: v.bloodGroup ? Number(v.bloodGroup) : null,
      dateOfBirth: v.dob || null,
      dateOfBirthStr: this.formatDateStr(v.dob),
      age: v.dob ? this.calcAge(v.dob) : 0,
      dateOfExpire: v.dateOfExpire || null,
      dateOfExpireStr: this.formatDateStr(v.dateOfExpire),
      occupation: v.occupation || null,
      isPfNominee: v.isPFNominee ? 1 : 0,
      pfPercentage: v.isPFNominee ? (v.pfPercentage ?? null) : null,
      isGratuityNominee: v.isGratuityNominee ? 1 : 0,
      gratuityPercentage: v.isGratuityNominee ? (v.gratuityPercentage ?? null) : null,
    };
    this.isFamilySaving = true;
    this.familySaveError = null;

    const api$ = isEdit
      ? this.contactSvc.updateFamilyDetails(payload)
      : this.contactSvc.postFamilyDetails(payload);

    api$.pipe(
      tap(() => {
        sessionStorage.removeItem(`familyCache_${this.currentEmpId}`);
        this.showFamilyModal = false;
        this.loadFamilyDetails();
        Swal.fire({
          title: isEdit ? 'Updated!' : 'Added!',
          text: isEdit
            ? 'Family member details updated successfully.'
            : 'Family member added successfully.',
          icon: 'success',
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }),
      catchError((err) => {
        const msg = this.extractErrorMsg(err, 'Failed to save. Please try again.');
        this.familySaveError = msg;
        Swal.fire({
          title: isEdit ? 'Update Failed' : 'Add Failed',
          text: msg,
          icon: 'error',
          confirmButtonColor: '#6d28d9',
          confirmButtonText: 'OK',
        });
        return of(null);
      }),
      finalize(() => { this.isFamilySaving = false; }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  deleteFamilyMember(m: FamilyMember): void {
    if (!m.relation) {
      Swal.fire({ icon: 'warning', title: 'Cannot Delete', text: 'Relation ID not found for this record. Please refresh the page and try again.', confirmButtonColor: '#6d28d9' });
      return;
    }
    if (this.deletingFamilyId !== null) return;

    Swal.fire({
      title: 'Mark as Inactive?',
      html: `<b>${m.fullName}</b> will be marked as <b>Inactive</b>.<br><small style="color:#6b7280">This action can be reversed later.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark Inactive',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    }).then(result => {
      if (!result.isConfirmed) return;

      this.deletingFamilyId = m.id;

      this.contactSvc.deleteFamilyDetails(this.userId, this.currentEmpId, Number(m.relation), 1002).pipe(
        tap(() => {
          sessionStorage.removeItem(`familyCache_${this.currentEmpId}`);
          this.familyMembers = this.familyMembers.filter(fm => fm.id !== m.id);
          this.loadFamilyDetails();
          Swal.fire({
            title: 'Marked Inactive!',
            text: `${m.fullName} has been marked as inactive.`,
            icon: 'success',
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }),
        catchError((err) => {
          Swal.fire({
            title: 'Action Failed',
            text: this.extractErrorMsg(err, 'Could not mark as inactive. Please try again.'),
            icon: 'error',
            confirmButtonColor: '#6d28d9',
            confirmButtonText: 'OK',
          });
          return of(null);
        }),
        finalize(() => { this.deletingFamilyId = null; }),
        takeUntil(this.destroy$)
      ).subscribe();
    });
  }

  toggleFamilyStatus(m: FamilyMember): void {
    if (!m.relation) {
      Swal.fire({ icon: 'warning', title: 'Cannot Change Status', text: 'Relation ID not found. Please refresh and try again.', confirmButtonColor: '#6d28d9' });
      return;
    }
    if (this.deletingFamilyId !== null) return;

    const isActive = m.status === 1001;
    const targetLabel = isActive ? 'Inactive' : 'Active';
    const targetId = isActive ? 1002 : 1001;

    Swal.fire({
      title: `Mark as ${targetLabel}?`,
      html: `<b>${m.fullName}</b> will be marked as <b>${targetLabel}</b>.<br><small style="color:#6b7280">This action can be reversed later.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, Mark ${targetLabel}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: isActive ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    }).then(result => {
      if (!result.isConfirmed) return;
      this.deletingFamilyId = m.id;
      this.contactSvc.deleteFamilyDetails(this.userId, this.currentEmpId, Number(m.relation), targetId).pipe(
        tap(() => {
          sessionStorage.removeItem(`familyCache_${this.currentEmpId}`);
          this.loadFamilyDetails();
          Swal.fire({ title: `Marked ${targetLabel}!`, text: `${m.fullName} has been marked as ${targetLabel}.`, icon: 'success', timer: 2500, timerProgressBar: true, showConfirmButton: false });
        }),
        catchError(err => {
          Swal.fire({ title: 'Action Failed', text: this.extractErrorMsg(err, 'Could not update status. Please try again.'), icon: 'error', confirmButtonColor: '#6d28d9' });
          return of(null);
        }),
        finalize(() => { this.deletingFamilyId = null; }),
        takeUntil(this.destroy$)
      ).subscribe();
    });
  }

  toggleEducationStatus(r: EducationRecord): void {
    if (r.transactionId == null) {
      Swal.fire({ icon: 'warning', title: 'Cannot Change Status', text: 'Transaction ID not found. Please refresh and try again.', confirmButtonColor: '#6d28d9' });
      return;
    }
    if (this.deletingEducationId !== null) return;

    const isActive = r.status === 1001;
    const targetLabel = isActive ? 'Inactive' : 'Active';
    const targetId = isActive ? 1002 : 1001;
    const qualName = this.qualifications.find(q => String(q.qualificationId) === String(r.qualificationId))?.qualificationName || r.qualificationId;

    Swal.fire({
      title: `Mark as ${targetLabel}?`,
      html: `Education record <b>${qualName}</b> will be marked as <b>${targetLabel}</b>.<br><small style="color:#6b7280">This action can be reversed later.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, Mark ${targetLabel}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: isActive ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    }).then(result => {
      if (!result.isConfirmed) return;
      this.deletingEducationId = r.id;
      this.contactSvc.deleteEducationDetails(this.userId, this.currentEmpId, r.transactionId!, targetId).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.deletingEducationId = null; })
      ).subscribe({
        next: () => {
          sessionStorage.removeItem(`educationCache_${this.currentEmpId}`);
          this.loadEducationDetails();
          Swal.fire({ title: `Marked ${targetLabel}!`, text: `Education record has been marked as ${targetLabel}.`, icon: 'success', timer: 2500, timerProgressBar: true, showConfirmButton: false });
        },
        error: err => Swal.fire({ title: 'Action Failed', text: this.extractErrorMsg(err, 'Could not update status. Please try again.'), icon: 'error', confirmButtonColor: '#6d28d9' }),
      });
    });
  }

  private extractErrorMsg(err: any, fallback: string): string {
    const raw = typeof err?.error === 'string' ? err.error.trim() : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.message) return parsed.message;
        if (parsed?.error) return parsed.error;
      } catch { return raw; }
    }
    if (typeof err?.error?.message === 'string') return err.error.message;
    if (typeof err?.message === 'string') return err.message;
    return fallback;
  }

  // ── Education ─────────────────────────────────────────────────────────────
  openAddEducation(): void {
    this.editingEducationId = null;
    this.educationSaveError = null;
    this.educationBranches = [];
    this.universitySearch = '';
    this.showUniversityDropdown = false;
    this.qualificationSearch = '';
    this.showQualificationDropdown = false;
    this.showBranchHint = false;
    this.buildEducationForm();
    this.showEducationModal = true;
  }
  editEducation(rec: EducationRecord): void {
    this.editingEducationId = rec.id;
    this.educationSaveError = null;
    this.educationBranches = [];
    const uId = rec.universityId;
    const uName = rec.universityName || (uId ? (this.universities.find(u => u.universityId == uId)?.universityName || '') : '');
    this.universitySearch = uName;
    this.showUniversityDropdown = false;
    const qId = rec.qualificationId;
    this.qualificationSearch = qId ? (this.qualifications.find(q => String(q.qualificationId) === String(qId))?.qualificationName || '') : '';
    this.showQualificationDropdown = false;
    this.showBranchHint = false;
    this.buildEducationForm(rec);
    if (rec.qualificationId) this.loadBranchesForQualification(rec.qualificationId);
    this.showEducationModal = true;
  }
  closeEducationModal(): void { this.showEducationModal = false; }

  saveEducation(): void {
    if (this.educationForm.invalid) { this.educationForm.markAllAsTouched(); return; }
    if (this.isEducationSaving) return;

    const v = this.educationForm.getRawValue();
    const isEdit = this.editingEducationId !== null;
    const existing = isEdit ? this.educationRecords.find(r => r.id === this.editingEducationId) : null;

    const payload: any = {
      userId: this.userId,
      empId: this.currentEmpId,
      transactionId: isEdit ? (existing?.transactionId ?? null) : null,
      qualificationId: v.qualificationId || null,
      branchId: v.branchId || null,
      institute: v.institute || null,
      universityId: v.universityId ? Number(v.universityId) : null,
      yearOfPassing: v.yearOfPassing ? Number(v.yearOfPassing) : null,
      percentageOfMarks: v.percentageOfMarks != null && v.percentageOfMarks !== '' ? parseFloat(v.percentageOfMarks) : null,
      educationTypeId: v.educationTypeId ? Number(v.educationTypeId) : null,
      isConsidered: v.isConsidered ? 1 : 0,
      isWageReview: v.isWageReview ? 1 : 0,
      isScale: v.isScale ? 1 : 0,
      status: 1001,
    };

    this.isEducationSaving = true;
    this.educationSaveError = null;

    const api$ = isEdit
      ? this.contactSvc.updateEducationDetails(payload)
      : this.contactSvc.postEducationDetails(payload);

    api$.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isEducationSaving = false)
    ).subscribe({
      next: () => {
        this.showEducationModal = false;
        sessionStorage.removeItem(`educationCache_${this.currentEmpId}`);
        this.loadEducationDetails();
        Swal.fire({ icon: 'success', title: 'Saved!', text: isEdit ? 'Education record updated successfully.' : 'Education record added successfully.', timer: 2000, showConfirmButton: false });
      },
      error: (err: any) => {
        this.educationSaveError = this.extractErrorMsg(err, 'Failed to save education record.');
        Swal.fire({ icon: 'error', title: 'Error', text: this.educationSaveError });
      }
    });
  }

  deleteEducation(rec: EducationRecord): void {
    if (rec.transactionId == null) return;
    Swal.fire({
      title: 'Mark as Inactive?',
      text: `This will deactivate the ${rec.qualificationId} record.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, deactivate',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.deletingEducationId = rec.id;
      this.contactSvc.deleteEducationDetails(this.userId, this.currentEmpId, rec.transactionId!, 1002).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.deletingEducationId = null)
      ).subscribe({
        next: () => {
          sessionStorage.removeItem(`educationCache_${this.currentEmpId}`);
          this.loadEducationDetails();
          Swal.fire({ icon: 'success', title: 'Deactivated', text: 'Education record marked as inactive.', timer: 2000, showConfirmButton: false });
        },
        error: (err: any) => {
          Swal.fire({ icon: 'error', title: 'Error', text: this.extractErrorMsg(err, 'Failed to deactivate record.') });
        }
      });
    });
  }

  editingEducationRecord(): EducationRecord | undefined {
    return this.editingEducationId !== null ? this.educationRecords.find(r => r.id === this.editingEducationId) : undefined;
  }

  // ── Experience ────────────────────────────────────────────────────────────
  openAddExperience(): void {
    this.editingExperienceId = null;
    this.experienceSaveError = null;
    this.isCurrentlyWorking = false;
    this.expQualificationSearch = '';
    this.showExpQualificationDropdown = false;
    this.expBranches = [];
    this.showExpBranchHint = false;
    if (this.expBranchHintTimer) { clearTimeout(this.expBranchHintTimer); this.expBranchHintTimer = null; }
    this.industryTypeSearch = '';
    this.showIndustryTypeDropdown = false;
    this.functionalAreaSearch = '';
    this.showFunctionalAreaDropdown = false;
    this.buildExperienceForm();
    this.showExperienceModal = true;
  }

  editExperience(rec: ExperienceRecord): void {
    this.editingExperienceId = rec.id;
    this.experienceSaveError = null;
    // "Currently working" when toDate is absent
    this.isCurrentlyWorking = !rec.toDate;
    // Init search display text from stored names
    this.expQualificationSearch = rec.qualification || '';
    this.showExpQualificationDropdown = false;
    this.expBranches = [];
    this.showExpBranchHint = false;
    if (this.expBranchHintTimer) { clearTimeout(this.expBranchHintTimer); this.expBranchHintTimer = null; }
    this.industryTypeSearch = this.getIndustryTypeName(rec.industryType) === '—' ? '' : this.getIndustryTypeName(rec.industryType);
    this.showIndustryTypeDropdown = false;
    this.functionalAreaSearch = this.getFunctionalAreaName(rec.functionalArea) === '—' ? '' : this.getFunctionalAreaName(rec.functionalArea);
    this.showFunctionalAreaDropdown = false;
    this.buildExperienceForm(rec);
    // Load branches for the qualification if one is already selected
    if (rec.qualificationId) {
      this.loadExpBranches(String(rec.qualificationId), rec.branchId, rec.branch);
    }
    this.showExperienceModal = true;
  }

  closeExperienceModal(): void { this.showExperienceModal = false; }

  expDateOrderWarning = false;

  onExpDateChange(): void {
    if (!this.experienceForm) return;
    const fromVal = this.experienceForm.get('fromDate')?.value;
    if (!fromVal) { this.experienceCalcMonths = 0; this.expDateOrderWarning = false; return; }
    const f = new Date(fromVal);
    if (isNaN(f.getTime())) { this.experienceCalcMonths = 0; this.expDateOrderWarning = false; return; }
    const toVal = this.isCurrentlyWorking ? null : this.experienceForm.get('toDate')?.value;
    const t = toVal ? new Date(toVal) : (this.isCurrentlyWorking ? new Date() : null);
    if (!t || isNaN(t.getTime())) { this.experienceCalcMonths = 0; this.expDateOrderWarning = false; return; }
    // Day-level comparison — catches same-month cases (e.g. 14 Jul → 06 Jul)
    this.expDateOrderWarning = t.getTime() <= f.getTime();
    const rawMonths = (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
    this.experienceCalcMonths = this.expDateOrderWarning ? 0 : Math.max(0, rawMonths);
  }

  toggleCurrentlyWorking(checked: boolean): void {
    this.isCurrentlyWorking = checked;
    const ctrl = this.experienceForm.get('toDate');
    if (checked) {
      ctrl?.setValue(null);
      ctrl?.disable();
      this.expDateOrderWarning = false;
    } else {
      // Only enable if a from date has already been chosen
      if (this.experienceForm.get('fromDate')?.value) {
        ctrl?.enable();
      }
    }
    this.onExpDateChange();
  }

  saveExperience(): void {
    if (this.experienceForm.invalid) { this.experienceForm.markAllAsTouched(); return; }
    if (this.expDateOrderWarning) { this.experienceForm.get('toDate')?.markAsTouched(); return; }
    if (this.isExperienceSaving) return;

    const v = this.experienceForm.getRawValue();
    const isEdit = this.editingExperienceId !== null;
    const existing = isEdit ? this.experienceRecords.find(r => r.id === this.editingExperienceId) : null;

    const qualName = this.qualifications.find(q => q.qualificationId == v.qualificationId)?.qualificationName || null;
    const branchName = v.branchId != null ? (this.expBranches.find(b => b.branchId == v.branchId)?.branchName || null) : null;

    const payload: any = {
      userId: this.userId,
      empId: this.currentEmpId,
      transactionId: isEdit ? (existing?.transactionId ?? null) : null,
      qualification: qualName,
      branch: branchName,
      fromDate: v.fromDate || null,
      toDate: v.toDate || null,
      isExperienceRelevant: Number(v.isExperienceRelevant),
      experience: this.experienceCalcMonths,
      natureOfWork: v.natureOfWork || null,
      industryType: v.industryType ? Number(v.industryType) : null,
      functionalArea: v.functionalArea ? Number(v.functionalArea) : null,
      designation: v.designation || null,
      employerName: v.employerName || null,
      employerAddress: v.employerAddress || null,
      employerPhone: v.employerPhone || null,
      salaryPerMonth: v.salaryPerMonth != null && v.salaryPerMonth !== '' ? parseFloat(v.salaryPerMonth) : 0.0,
      reasonForLeaving: v.reasonForLeaving || null,
      achievements: v.achievements || null,
      comments: v.comments || null,
      status: Number(v.status),
    };

    this.isExperienceSaving = true;
    this.experienceSaveError = null;

    const api$ = isEdit
      ? this.contactSvc.updateExperienceDetails(payload)
      : this.contactSvc.postExperienceDetails(payload);

    api$.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isExperienceSaving = false)
    ).subscribe({
      next: () => {
        this.showExperienceModal = false;
        sessionStorage.removeItem(`experienceCache_${this.currentEmpId}`);
        this.loadExperienceDetails();
        Swal.fire({ icon: 'success', title: 'Saved!', text: isEdit ? 'Experience record updated successfully.' : 'Experience record added successfully.', timer: 2000, showConfirmButton: false });
      },
      error: (err: any) => {
        this.experienceSaveError = this.extractErrorMsg(err, 'Failed to save experience record.');
        Swal.fire({ icon: 'error', title: 'Error', text: this.experienceSaveError! });
      }
    });
  }

  toggleExperienceStatus(r: ExperienceRecord): void {
    if (r.transactionId == null) {
      Swal.fire({ icon: 'warning', title: 'Cannot Change Status', text: 'Transaction ID not found. Please refresh and try again.', confirmButtonColor: '#6d28d9' });
      return;
    }
    if (this.deletingExperienceId !== null) return;

    const isActive = r.status === 1001;
    const targetLabel = isActive ? 'Inactive' : 'Active';
    const targetId = isActive ? 1002 : 1001;

    Swal.fire({
      title: `Mark as ${targetLabel}?`,
      html: `Experience at <b>${r.employerName}</b> will be marked as <b>${targetLabel}</b>.<br><small style="color:#6b7280">This action can be reversed later.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, Mark ${targetLabel}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: isActive ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    }).then(result => {
      if (!result.isConfirmed) return;
      this.deletingExperienceId = r.id;
      this.contactSvc.UpdateStatusExperienceDetails(this.userId, this.currentEmpId, r.transactionId!, targetId).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.deletingExperienceId = null; })
      ).subscribe({
        next: () => {
          sessionStorage.removeItem(`experienceCache_${this.currentEmpId}`);
          this.loadExperienceDetails();
          Swal.fire({ title: `Marked ${targetLabel}!`, text: `Experience record marked as ${targetLabel}.`, icon: 'success', timer: 2500, timerProgressBar: true, showConfirmButton: false });
        },
        error: err => Swal.fire({ title: 'Action Failed', text: this.extractErrorMsg(err, 'Could not update status. Please try again.'), icon: 'error', confirmButtonColor: '#6d28d9' }),
      });
    });
  }

  editingExperienceRecord(): ExperienceRecord | undefined {
    return this.editingExperienceId !== null ? this.experienceRecords.find(r => r.id === this.editingExperienceId) : undefined;
  }

  // ── References ────────────────────────────────────────────────────────────
  openAddReference(): void { this.editingReferenceId = null; this.buildReferenceForm(); this.showReferenceModal = true; }
  editReference(rec: ReferenceRecord): void { this.editingReferenceId = rec.id; this.buildReferenceForm(rec); this.showReferenceModal = true; }
  closeReferenceModal(): void { this.showReferenceModal = false; }
  saveReference(): void {
    if (this.referenceForm.invalid) { this.referenceForm.markAllAsTouched(); return; }
    const v = this.referenceForm.value as ReferenceRecord;
    if (this.editingReferenceId !== null) {
      const idx = this.referenceRecords.findIndex(r => r.id === this.editingReferenceId);
      if (idx !== -1) this.referenceRecords[idx] = { ...this.referenceRecords[idx], ...v };
    } else {
      this.referenceRecords.push({ ...v, id: Math.max(0, ...this.referenceRecords.map(r => r.id), 0) + 1 });
    }
    this.showReferenceModal = false;
  }

  // ── CTC ───────────────────────────────────────────────────────────────────
  saveNewCtc(): void {
    if (this.newCtcForm.invalid) { this.newCtcForm.markAllAsTouched(); return; }
    Object.assign(this.ctcData.new, this.newCtcForm.value);
  }

  // ── Permanent address sync ────────────────────────────────────────────────
  onSameAsCurrentChange(): void {
    if (this.permAddressForm.get('sameAsCurrent')?.value) {
      const ca = this.commAddressForm.value;
      this.permAddressForm.patchValue({ addressLane1: ca.addressLane1, addressLane2: ca.addressLane2, addressLane3: ca.addressLane3, addressLane4: ca.addressLane4, country: ca.country, state: ca.state, city: ca.city, pinCode: ca.pinCode });
      this.sectionStates['perm'] = [...(this.sectionStates['comm'] || [])];
      this.sectionCities['perm'] = [...(this.sectionCities['comm'] || [])];
    } else {
      this.permAddressForm.patchValue({ addressLane1: '', addressLane2: '', addressLane3: '', addressLane4: '', country: '', state: '', city: '', pinCode: '' });
      this.sectionStates['perm'] = [];
      this.sectionCities['perm'] = [];
    }
  }

  onIceAddressModeChange(): void {
    const mode = this.iceForm.get('addressMode')?.value;
    if (mode === 'current') {
      const ca = this.commAddressForm.value;
      this.iceForm.patchValue({ addressLane1: ca.addressLane1, addressLane2: ca.addressLane2, addressLane3: ca.addressLane3, addressLane4: ca.addressLane4, country: ca.country, state: ca.state, city: ca.city, pinCode: ca.pinCode });
      this.sectionStates['ice'] = [...(this.sectionStates['comm'] || [])];
      this.sectionCities['ice'] = [...(this.sectionCities['comm'] || [])];
    } else if (mode === 'permanent') {
      const pa = this.permAddressForm.value;
      this.iceForm.patchValue({ addressLane1: pa.addressLane1, addressLane2: pa.addressLane2, addressLane3: pa.addressLane3 || '', addressLane4: pa.addressLane4 || '', country: pa.country, state: pa.state, city: pa.city, pinCode: pa.pinCode });
      this.sectionStates['ice'] = [...(this.sectionStates['perm'] || [])];
      this.sectionCities['ice'] = [...(this.sectionCities['perm'] || [])];
      // 'custom' — leave address fields as-is so the user can edit them
    }
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  setActiveTab(id: string): void { this.activeTab = id; }
  isInvalid(form: FormGroup, field: string): boolean { const c = form.get(field); return !!(c && c.invalid && (c.touched || c.dirty)); }
  fieldError(form: FormGroup, field: string, errorType: string): boolean { const c = form.get(field); return !!(c && c.errors?.[errorType] && (c.touched || c.dirty)); }
  displayVal(v: any): string { return v === null || v === undefined || v === '' ? '—' : String(v); }

  // ── Experience Qualification typeahead ────────────────────────────────────
  get filteredExpQualifications(): any[] {
    const q = this.expQualificationSearch.trim().toLowerCase();
    return q ? this.qualifications.filter(ql => (ql.qualificationName || '').toLowerCase().includes(q)) : this.qualifications;
  }

  onExpQualificationInput(event: Event): void {
    this.expQualificationSearch = (event.target as HTMLInputElement).value;
    this.showExpQualificationDropdown = true;
    if (!this.expQualificationSearch) { this.clearExpQualification(); }
  }

  selectExpQualification(ql: any): void {
    this.expQualificationSearch = ql.qualificationName;
    this.showExpQualificationDropdown = false;
    this.experienceForm.patchValue({ qualificationId: ql.qualificationId, branchId: null });
    this.experienceForm.get('branchId')?.enable();
    this.expBranches = [];
    this.loadExpBranches(String(ql.qualificationId), null);
  }

  clearExpQualification(): void {
    this.expQualificationSearch = '';
    this.showExpQualificationDropdown = false;
    this.experienceForm.patchValue({ qualificationId: null, branchId: null });
    this.experienceForm.get('branchId')?.disable();
    this.expBranches = [];
    this.showExpBranchHint = false;
    if (this.expBranchHintTimer) { clearTimeout(this.expBranchHintTimer); this.expBranchHintTimer = null; }
  }

  hideExpQualificationDropdown(): void {
    setTimeout(() => {
      this.showExpQualificationDropdown = false;
      this.experienceForm.get('qualificationId')?.markAsTouched();
      const selId = this.experienceForm.get('qualificationId')?.value;
      if (selId) {
        const m = this.qualifications.find(q => q.qualificationId == selId);
        this.expQualificationSearch = m?.qualificationName || '';
      } else {
        this.expQualificationSearch = '';
      }
    }, 200);
  }

  loadExpBranches(qualId: string, existingBranchId: number | null, existingBranchName?: string | null): void {
    this.isLoadingExpBranches = true;
    this.expBranches = [];
    this.showExpBranchHint = false;
    if (this.expBranchHintTimer) { clearTimeout(this.expBranchHintTimer); this.expBranchHintTimer = null; }
    this.contactSvc.getbranches(qualId).pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingExpBranches = false)).subscribe({
      next: (branches: any[]) => {
        this.expBranches = Array.isArray(branches) ? branches : [];
        if (this.expBranches.length > 0) {
          this.experienceForm.get('branchId')?.enable();
          // Match by ID first; fall back to name when API omits branchId
          let match = existingBranchId != null
            ? this.expBranches.find(b => b.branchId == existingBranchId)
            : null;
          if (!match && existingBranchName) {
            match = this.expBranches.find(b =>
              (b.branchName || '').trim().toLowerCase() === existingBranchName.trim().toLowerCase()
            );
          }
          if (match) { this.experienceForm.patchValue({ branchId: match.branchId }); }
        } else {
          this.showExpBranchHint = true;
          this.expBranchHintTimer = setTimeout(() => { this.showExpBranchHint = false; }, 10000);
        }
      },
      error: () => { this.expBranches = []; }
    });
  }

  // ── Experience Industry Type typeahead ────────────────────────────────────
  get filteredIndustryTypes(): any[] {
    const q = this.industryTypeSearch.trim().toLowerCase();
    return q ? this.industryTypes.filter(it => (it.industryTypeName || '').toLowerCase().includes(q)) : this.industryTypes;
  }

  onIndustryTypeInput(event: Event): void {
    this.industryTypeSearch = (event.target as HTMLInputElement).value;
    this.showIndustryTypeDropdown = true;
    if (!this.industryTypeSearch) { this.experienceForm.patchValue({ industryType: null }); }
  }

  selectIndustryType(it: any): void {
    this.industryTypeSearch = it.industryTypeName;
    this.showIndustryTypeDropdown = false;
    this.experienceForm.patchValue({ industryType: it.industryTypeId });
  }

  clearIndustryType(): void {
    this.industryTypeSearch = '';
    this.showIndustryTypeDropdown = false;
    this.experienceForm.patchValue({ industryType: null });
  }

  hideIndustryTypeDropdown(): void {
    setTimeout(() => {
      this.showIndustryTypeDropdown = false;
      const selId = this.experienceForm.get('industryType')?.value;
      if (selId) {
        const m = this.industryTypes.find(it => it.industryTypeId == selId);
        this.industryTypeSearch = m?.industryTypeName || '';
      } else {
        this.industryTypeSearch = '';
      }
    }, 200);
  }

  // ── Experience Functional Area typeahead ──────────────────────────────────
  get filteredFunctionalAreas(): any[] {
    const q = this.functionalAreaSearch.trim().toLowerCase();
    return q ? this.functionalAreas.filter(fa => (fa.functionalAreaIName || '').toLowerCase().includes(q)) : this.functionalAreas;
  }

  onFunctionalAreaInput(event: Event): void {
    this.functionalAreaSearch = (event.target as HTMLInputElement).value;
    this.showFunctionalAreaDropdown = true;
    if (!this.functionalAreaSearch) { this.experienceForm.patchValue({ functionalArea: null }); }
  }

  selectFunctionalArea(fa: any): void {
    this.functionalAreaSearch = fa.functionalAreaIName;
    this.showFunctionalAreaDropdown = false;
    this.experienceForm.patchValue({ functionalArea: fa.functionalAreaId });
  }

  clearFunctionalArea(): void {
    this.functionalAreaSearch = '';
    this.showFunctionalAreaDropdown = false;
    this.experienceForm.patchValue({ functionalArea: null });
  }

  hideFunctionalAreaDropdown(): void {
    setTimeout(() => {
      this.showFunctionalAreaDropdown = false;
      const selId = this.experienceForm.get('functionalArea')?.value;
      if (selId) {
        const m = this.functionalAreas.find(fa => fa.functionalAreaId == selId);
        this.functionalAreaSearch = m?.functionalAreaIName || '';
      } else {
        this.functionalAreaSearch = '';
      }
    }, 200);
  }

  getIndustryTypeName(id: number | null): string {
    if (!id) return '—';
    return this.industryTypes.find(it => it.industryTypeId == id)?.industryTypeName || '—';
  }
  getFunctionalAreaName(id: number | null): string {
    if (!id) return '—';
    return this.functionalAreas.find(fa => fa.functionalAreaId == id)?.functionalAreaIName || '—';
  }

  getBloodGroupName(id: any): string {
    if (!id && id !== 0) return '—';
    return this.bloodGroups.find(b => b.bloodGroupId == id)?.bloodGroupName || String(id);
  }

  private formatDateStr(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  calcAge(dob: string): number {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  }
  getCountryName(id: any): string { return this.countries.find(c => c.countryId == id)?.countryName || this.displayVal(id); }
  getStateName(section: string, id: any): string { return (this.sectionStates[section] || []).find((s: any) => s.stateId == id)?.stateName || this.displayVal(id); }
  getCityName(section: string, id: any): string { return (this.sectionCities[section] || []).find((c: any) => c.cityId == id)?.cityName || this.displayVal(id); }
  getRelationName(id: any): string { return this.relations.find(r => r.relationId == id)?.relationName || this.displayVal(id); }
  getNationalityName(id: any): string { return this.nationalities.find(n => n.nationalityId == id)?.nationalityName || this.displayVal(id); }
  getReligionName(id: any): string { return this.religions.find(r => r.religionId == id)?.religionName || this.displayVal(id); }
  getLanguageName(id: any): string { return this.languages.find(l => l.languageId == id)?.languageName || this.displayVal(id); }
  getDobTypeName(id: any): string { return this.dobTypes.find(d => d.dobTypeId == id)?.dobTypeName || this.displayVal(id); }
  getActiveTabLabel(): string { return this.tabs.find(t => t.id === this.activeTab)?.label ?? this.activeTab; }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.branchHintTimer) { clearTimeout(this.branchHintTimer); }
    if (this.expBranchHintTimer) { clearTimeout(this.expBranchHintTimer); }
  }

  goBack(): void { this.router.navigate(['/hrms/employees']); }

  get empSubtitle(): string {
    if (!this.employee) return '';
    return `${this.employee.fullName} - ${this.employee.empId}`;
  }

  // ── Professional forms ────────────────────────────────────────────────────
  private buildProfessionalForms(): void {
    const p = this.professionalData.professional;
    this.profProfForm = this.fb.group({
      department: [p.department, [Validators.required]],
      section: [p.section],
      designation: [p.designation, [Validators.required]],
      paysheetGroup: [p.paysheetGroup, [Validators.required]],
    });
    const w = this.professionalData.workLocation;
    this.workLocationForm = this.fb.group({
      headQuarter: [w.headQuarter, [Validators.required]],
      region: [w.region],
    });
    const r = this.professionalData.reportingOfficer;
    this.reportingOfficerForm = this.fb.group({
      reportingOfficer: [r.reportingOfficer, [Validators.required]],
      employeeId: [r.employeeId],
      isHOD: [r.isHOD],
    });
    const pr = this.professionalData.profile;
    this.profileForm = this.fb.group({
      termsOfService: [pr.termsOfService, [Validators.required]],
      dateOfJoining: [pr.dateOfJoining, [Validators.required]],
      groupDateOfJoining: [pr.groupDateOfJoining],
      firstDateOfWork: [pr.firstDateOfWork],
      dateOfResign: [pr.dateOfResign],
    });
    const el = this.professionalData.experienceLevel;
    this.expLevelForm = this.fb.group({
      experienceLevel: [el.experienceLevel, [Validators.required]],
      incrementType: [el.incrementType, [Validators.required]],
    });
  }

  saveProfProf(): void {
    if (this.profProfForm.invalid) { this.profProfForm.markAllAsTouched(); return; }
    Object.assign(this.professionalData.professional, this.profProfForm.value);
    this.editing['profProf'] = false;
  }
  saveWorkLocation(): void {
    if (this.workLocationForm.invalid) { this.workLocationForm.markAllAsTouched(); return; }
    Object.assign(this.professionalData.workLocation, this.workLocationForm.value);
    this.editing['workLocation'] = false;
  }
  saveReportingOfficer(): void {
    if (this.reportingOfficerForm.invalid) { this.reportingOfficerForm.markAllAsTouched(); return; }
    Object.assign(this.professionalData.reportingOfficer, this.reportingOfficerForm.value);
    this.editing['reportingOfficer'] = false;
  }
  saveProfProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    Object.assign(this.professionalData.profile, this.profileForm.value);
    this.editing['profProfile'] = false;
  }
  saveExpLevel(): void {
    if (this.expLevelForm.invalid) { this.expLevelForm.markAllAsTouched(); return; }
    Object.assign(this.professionalData.experienceLevel, this.expLevelForm.value);
    this.editing['expLevel'] = false;
  }

  // ── Transfer forms & CRUD ─────────────────────────────────────────────────
  private buildTransferForm(rec?: TransferRecord): void {
    this.transferForm = this.fb.group({
      transferType: [rec?.transferType || '', [Validators.required]],
      transferDetails: [rec?.transferDetails || '', [Validators.required]],
      businessUnit: [rec?.businessUnit || ''],
      costCentre: [rec?.costCentre || ''],
      department: [rec?.department || ''],
      section: [rec?.section || ''],
      designation: [rec?.designation || ''],
      workLocation: [rec?.workLocation || ''],
      transferDate: [rec?.transferDate || '', [Validators.required]],
      reportingDateAndTime: [rec?.reportingDateAndTime || ''],
      reportingOfficer: [rec?.reportingOfficer || ''],
      employeeId: [rec?.employeeId || ''],
      paysheetGroup: [rec?.paysheetGroup || ''],
      payStructure: [rec?.payStructure || ''],
      notes: [rec?.notes || ''],
    });
    this.transferActionForm = this.fb.group({
      actionType: [rec?.actionType || '', [Validators.required]],
      actionBy: [rec?.actionBy || '', [Validators.required]],
      actionDate: [rec?.actionDate || '', [Validators.required]],
      documentNo: [rec?.documentNo || ''],
      documentDate: [rec?.documentDate || ''],
      documentSource: [rec?.documentSource || ''],
      status: [rec?.status || '', [Validators.required]],
      comments: [rec?.comments || ''],
    });
  }

  openAddTransfer(): void {
    this.editingTransferId = null;
    this.buildTransferForm();
    this.transferStep = 1;
    this.showTransferModal = true;
  }
  editTransfer(rec: TransferRecord): void {
    this.editingTransferId = rec.id;
    this.buildTransferForm(rec);
    this.transferStep = 1;
    this.showTransferModal = true;
  }
  closeTransferModal(): void { this.showTransferModal = false; }
  continueToActionDetails(): void {
    if (this.transferForm.invalid) { this.transferForm.markAllAsTouched(); return; }
    this.transferStep = 2;
  }
  goBackToTransferStep(): void { this.transferStep = 1; }
  saveTransferDetails(): void {
    if (this.transferActionForm.invalid) { this.transferActionForm.markAllAsTouched(); return; }
    const v = { ...this.transferForm.value, ...this.transferActionForm.value } as TransferRecord;
    if (this.editingTransferId !== null) {
      const idx = this.transferRecords.findIndex(r => r.id === this.editingTransferId);
      if (idx !== -1) this.transferRecords[idx] = { ...this.transferRecords[idx], ...v };
    } else {
      this.transferRecords.push({ ...v, id: Math.max(0, ...this.transferRecords.map(r => r.id)) + 1 });
    }
    this.showTransferModal = false;
  }
  editingTransferRecord(): TransferRecord | undefined {
    return this.editingTransferId !== null ? this.transferRecords.find(r => r.id === this.editingTransferId) : undefined;
  }

  // ── HR Actions forms & CRUD ───────────────────────────────────────────────
  private buildHrActionForm(rec?: HrActionRecord): void {
    this.hrActionForm = this.fb.group({
      category: [rec?.category || '', [Validators.required]],
      actionConsideredBy: [rec?.actionConsideredBy || '', [Validators.required]],
      employeeId: [rec?.employeeId || ''],
      actionConsideredDate: [rec?.actionConsideredDate || '', [Validators.required]],
      notes: [rec?.notes || ''],
      lastWorkingDay: [rec?.lastWorkingDay || ''],
      status: [rec?.status || 'Active', [Validators.required]],
    });
  }

  openAddHrAction(): void {
    this.editingHrActionId = null;
    this.buildHrActionForm();
    this.showHrActionModal = true;
  }
  editHrAction(rec: HrActionRecord): void {
    this.editingHrActionId = rec.id;
    this.buildHrActionForm(rec);
    this.showHrActionModal = true;
  }
  closeHrActionModal(): void { this.showHrActionModal = false; }
  saveHrAction(): void {
    if (this.hrActionForm.invalid) { this.hrActionForm.markAllAsTouched(); return; }
    const v = this.hrActionForm.value as HrActionRecord;
    if (this.editingHrActionId !== null) {
      const idx = this.hrActionRecords.findIndex(r => r.id === this.editingHrActionId);
      if (idx !== -1) this.hrActionRecords[idx] = { ...this.hrActionRecords[idx], ...v };
    } else {
      this.hrActionRecords.push({ ...v, id: Math.max(0, ...this.hrActionRecords.map(r => r.id)) + 1 });
    }
    this.showHrActionModal = false;
  }
  editingHrActionRecord(): HrActionRecord | undefined {
    return this.editingHrActionId !== null ? this.hrActionRecords.find(r => r.id === this.editingHrActionId) : undefined;
  }

}

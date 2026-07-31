import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HRMS_API_BASE } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = HRMS_API_BASE;

  getContactDetails(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/contact/details`, formData);
  }

  updateProfessionalContact(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/update/professional/contact`, data, { responseType: 'text' as 'json' });
  }

  updatePersonalContact(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/update/personal/contact`, data, { responseType: 'text' as 'json' });
  }

  updateIceContact(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/update/ice/contact`, data, { responseType: 'text' as 'json' });
  }

  //famil Details
  getFamilyDetails(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/family/details`, formData);
  }
  postFamilyDetails(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/family/add`, data, { responseType: 'text' as 'json' });
  }

  updateFamilyDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/family/update`, data, { responseType: 'text' as 'json' });
  }

  deleteFamilyDetails(userId: number, empId: number, relationId: number, statusId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/family/update-status/${userId}/${empId}/${relationId}/${statusId}`, {}, { responseType: 'text' as 'json' });
  }
  //education details 
  getEducationDetails(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/education/details`, formData);
  }
  postEducationDetails(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/education/add`, data, { responseType: 'text' as 'json' });
  }

  updateEducationDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/education/update`, data, { responseType: 'text' as 'json' });
  }

  deleteEducationDetails(userId: number, empId: number, transactionId: number, satusId:number): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/education/update-status/${userId}/${empId}/${transactionId}/${satusId}`, {}, { responseType: 'text' as 'json' });
  }

  getQualifications(): Observable<any> {
    return this.http.get<any>(`${this.base}/master/qualifications`);
  }

  getbranches(qualificationId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/master/qualification/branch/${qualificationId}`);
  }

  // POST -{{baseurl}}/employee/experience/details
 
// PUT - {{baseurl}}/employee/experience/update-status/12699/10515/287/1001
 // Experience Details
  getExperienceDetails(formdata:FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/experience/details`, formdata);
  }
  postExperienceDetails(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/experience/add`, data, { responseType: 'text' as 'json' });
  }

  updateExperienceDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/experience/update`, data, { responseType: 'text' as 'json' });
  }

  UpdateStatusExperienceDetails(userId: number, empId: number, transactionId: number, satusId:number): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/experience/update-status/${userId}/${empId}/${transactionId}/${satusId}`, {}, { responseType: 'text' as 'json' });
  }

  //personal details
 getPersonalDetails(formdata:FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/personal/details`, formdata);
  }

  updatePersonalDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/personal-info/update`, data, { responseType: 'text' as 'json' });
  }
  updateLanguageDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/language-info/update`, data, { responseType: 'text' as 'json' });
  }
  updateHealthDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/health-info/update`, data, { responseType: 'text' as 'json' });
  }
  updateIdentificationMarksDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/identification-marks-info/update`, data, { responseType: 'text' as 'json' });
  }
  updateIdentityDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/identity-info/update`, data, { responseType: 'text' as 'json' });
  }
  updatePreviousPfDetails(data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/previous-pf-info/update`, data, { responseType: 'text' as 'json' });
  }
  addLanguageDetails(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/employee/language/add`, data, { responseType: 'text' as 'json' });
  }
  deactivateLanguageDetails(userId: number, empId: number, languageId:number): Observable<any> {
    return this.http.put<any>(`${this.base}/employee/language/deactivate/${userId}/${empId}/${languageId}`, {}, { responseType: 'text' as 'json' });
  }
}

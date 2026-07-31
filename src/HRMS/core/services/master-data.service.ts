import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { HRMS_API_BASE } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private readonly http = inject(HttpClient);
  private readonly base = HRMS_API_BASE;

  // Global, parameterless endpoints — one HTTP request per app session
  private readonly genders$ = this.http.get<any[]>(`${this.base}/master/gender`).pipe(shareReplay(1));
  private readonly employments$ = this.http.get<any[]>(`${this.base}/master/employments`).pipe(shareReplay(1));
  private readonly departments$ = this.http.get<any[]>(`${this.base}/master/departments`).pipe(shareReplay(1));
  private readonly statuses$ = this.http.get<any[]>(`${this.base}/master/statuscodes`).pipe(shareReplay(1));
  private readonly countries$ = this.http.get<any[]>(`${this.base}/master/countries`).pipe(shareReplay(1));
  private readonly relations$ = this.http.get<any[]>(`${this.base}/master/relations`).pipe(shareReplay(1));
  private readonly bloodGroups$ = this.http.get<any[]>(`${this.base}/master/bloodgroup`).pipe(shareReplay(1));
  private readonly educationTypes$ = this.http.get<any[]>(`${this.base}/master/educationtype`).pipe(shareReplay(1));
  private readonly universities$ = this.http.get<any[]>(`${this.base}/master/university`).pipe(shareReplay(1));
  private readonly industries$ = this.http.get<any[]>(`${this.base}/master/industry`).pipe(shareReplay(1));
  private readonly functionalAreas$ = this.http.get<any[]>(`${this.base}/master/functional/area`).pipe(shareReplay(1));
  private readonly nationalities$ = this.http.get<any[]>(`${this.base}/master/nationality`).pipe(shareReplay(1));
  private readonly religions$ = this.http.get<any[]>(`${this.base}/master/religion`).pipe(shareReplay(1));
  private readonly languages$ = this.http.get<any[]>(`${this.base}/master/languages`).pipe(shareReplay(1));
  private readonly dobTypes$ = this.http.get<any[]>(`${this.base}/master/dob/type`).pipe(shareReplay(1));
  private readonly maritalStatuses$ = this.http.get<any[]>(`${this.base}/master/marital/status`).pipe(shareReplay(1));

  // Parameterized — cached per key
  private readonly statesCache$ = new Map<number, Observable<any[]>>();
  private readonly citiesCache$ = new Map<number, Observable<any[]>>();

  getGenders(): Observable<any[]> { return this.genders$; }
  getEmployments(): Observable<any[]> { return this.employments$; }
  getDepartments(): Observable<any[]> { return this.departments$; }
  getStatuses(): Observable<any[]> { return this.statuses$; }
  getCountries(): Observable<any[]> { return this.countries$; }
  getRelations(): Observable<any[]> { return this.relations$; }

  getUserBu(empId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/master/user/bu/${empId}`);
  }

  getStates(countryId: number): Observable<any[]> {
    if (!this.statesCache$.has(countryId)) {
      this.statesCache$.set(
        countryId,
        this.http.get<any[]>(`${this.base}/master/states/${countryId}`).pipe(shareReplay(1))
      );
    }
    return this.statesCache$.get(countryId)!;
  }

  getCities(stateId: number): Observable<any[]> {
    if (!this.citiesCache$.has(stateId)) {
      this.citiesCache$.set(
        stateId,
        this.http.get<any[]>(`${this.base}/master/cities/${stateId}`).pipe(shareReplay(1))
      );
    }
    return this.citiesCache$.get(stateId)!;
  }


  getBloodGroups(): Observable<any[]> { return this.bloodGroups$; }
  getEducationTypes(): Observable<any[]> { return this.educationTypes$; }
  getUniversities(): Observable<any[]> { return this.universities$; }

  getIndustry(): Observable<any[]> { return this.industries$; }
  getFunctionalArea(): Observable<any[]> { return this.functionalAreas$; }



  getNationality(): Observable<any[]> { return this.nationalities$; }
  getReligion(): Observable<any[]> { return this.religions$; }
  getLanguages(): Observable<any[]> { return this.languages$; }
  getDobType(): Observable<any[]> { return this.dobTypes$; }


  getMaritalStatus(): Observable<any[]> { return this.maritalStatuses$; }
}

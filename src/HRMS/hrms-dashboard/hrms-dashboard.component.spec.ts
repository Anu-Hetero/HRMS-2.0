import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrmsDashboardComponent } from './hrms-dashboard.component';

describe('HrmsDashboardComponent', () => {
  let component: HrmsDashboardComponent;
  let fixture: ComponentFixture<HrmsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrmsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrmsDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

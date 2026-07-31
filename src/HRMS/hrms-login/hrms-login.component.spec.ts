import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrmsLoginComponent } from './hrms-login.component';

describe('HrmsLoginComponent', () => {
  let component: HrmsLoginComponent;
  let fixture: ComponentFixture<HrmsLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrmsLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrmsLoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardfreelencerComponent } from './dashboardfreelencer.component';

describe('DashboardfreelencerComponent', () => {
  let component: DashboardfreelencerComponent;
  let fixture: ComponentFixture<DashboardfreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardfreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardfreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionsclientComponent } from './missionsclient.component';

describe('MissionsclientComponent', () => {
  let component: MissionsclientComponent;
  let fixture: ComponentFixture<MissionsclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionsclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionsclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

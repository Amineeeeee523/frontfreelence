import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionfreelencerComponent } from './missionfreelencer.component';

describe('MissionfreelencerComponent', () => {
  let component: MissionfreelencerComponent;
  let fixture: ComponentFixture<MissionfreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionfreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionfreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

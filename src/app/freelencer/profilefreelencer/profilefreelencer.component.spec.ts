import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilefreelencerComponent } from './profilefreelencer.component';

describe('ProfilefreelencerComponent', () => {
  let component: ProfilefreelencerComponent;
  let fixture: ComponentFixture<ProfilefreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilefreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilefreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

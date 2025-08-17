import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarFreelencerComponent } from './navbar-freelencer.component';

describe('NavbarFreelencerComponent', () => {
  let component: NavbarFreelencerComponent;
  let fixture: ComponentFixture<NavbarFreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarFreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarFreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

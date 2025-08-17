import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarclientComponent } from './navbarclient.component';

describe('NavbarclientComponent', () => {
  let component: NavbarclientComponent;
  let fixture: ComponentFixture<NavbarclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

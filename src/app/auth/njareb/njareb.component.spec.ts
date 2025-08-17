import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NjarebComponent } from './njareb.component';

describe('NjarebComponent', () => {
  let component: NjarebComponent;
  let fixture: ComponentFixture<NjarebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NjarebComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NjarebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

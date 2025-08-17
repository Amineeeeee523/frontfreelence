import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementfreelencerComponent } from './paiementfreelencer.component';

describe('PaiementfreelencerComponent', () => {
  let component: PaiementfreelencerComponent;
  let fixture: ComponentFixture<PaiementfreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementfreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaiementfreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

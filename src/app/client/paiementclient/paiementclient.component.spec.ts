import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementclientComponent } from './paiementclient.component';

describe('PaiementclientComponent', () => {
  let component: PaiementclientComponent;
  let fixture: ComponentFixture<PaiementclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaiementclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

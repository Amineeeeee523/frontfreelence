import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuiviprojetclientComponent } from './suiviprojetclient.component';

describe('SuiviprojetclientComponent', () => {
  let component: SuiviprojetclientComponent;
  let fixture: ComponentFixture<SuiviprojetclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuiviprojetclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuiviprojetclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageriedclientComponent } from './messageriedclient.component';

describe('MessageriedclientComponent', () => {
  let component: MessageriedclientComponent;
  let fixture: ComponentFixture<MessageriedclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageriedclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageriedclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

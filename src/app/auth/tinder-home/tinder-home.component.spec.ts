import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TinderHomeComponent } from './tinder-home.component';

describe('TinderHomeComponent', () => {
  let component: TinderHomeComponent;
  let fixture: ComponentFixture<TinderHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TinderHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TinderHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

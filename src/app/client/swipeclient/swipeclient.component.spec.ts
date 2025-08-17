import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwipeclientComponent } from './swipeclient.component';

describe('SwipeclientComponent', () => {
  let component: SwipeclientComponent;
  let fixture: ComponentFixture<SwipeclientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwipeclientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwipeclientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

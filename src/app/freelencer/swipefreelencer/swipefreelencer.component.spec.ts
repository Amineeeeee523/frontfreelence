import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwipefreelencerComponent } from './swipefreelencer.component';

describe('SwipefreelencerComponent', () => {
  let component: SwipefreelencerComponent;
  let fixture: ComponentFixture<SwipefreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwipefreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwipefreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChattingfreelencerComponent } from './chattingfreelencer.component';

describe('ChattingfreelencerComponent', () => {
  let component: ChattingfreelencerComponent;
  let fixture: ComponentFixture<ChattingfreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChattingfreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChattingfreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarfreelencerComponent } from './sidebarfreelencer.component';

describe('SidebarfreelencerComponent', () => {
  let component: SidebarfreelencerComponent;
  let fixture: ComponentFixture<SidebarfreelencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarfreelencerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarfreelencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

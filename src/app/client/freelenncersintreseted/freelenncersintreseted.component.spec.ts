import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelenncersintresetedComponent } from './freelenncersintreseted.component';

describe('FreelenncersintresetedComponent', () => {
  let component: FreelenncersintresetedComponent;
  let fixture: ComponentFixture<FreelenncersintresetedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreelenncersintresetedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreelenncersintresetedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

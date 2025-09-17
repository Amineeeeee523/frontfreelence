import { Component, Input, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stars-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="stars-rating" 
      [class.disabled]="disabled"
      role="radiogroup"
      [attr.aria-label]="'Évaluation sur 5 étoiles, actuellement ' + value + ' étoiles'"
      tabindex="0"
      (keydown)="onKeyDown($event)">
      <span 
        *ngFor="let star of stars; let i = index"
        class="star"
        [class.active]="i < value"
        [class.hover]="i < hoverValue"
        [attr.aria-label]="'Donner ' + (i + 1) + ' étoiles'"
        role="radio"
        [attr.aria-checked]="i < value"
        tabindex="-1"
        (click)="onStarClick(i + 1)"
        (mouseenter)="onMouseEnter(i + 1)"
        (mouseleave)="onMouseLeave()">
        ★
      </span>
    </div>
  `,
  styles: [`
    .stars-rating {
      display: inline-flex;
      gap: 6px;
      font-size: 18px;
      cursor: pointer;
      align-items: center;
    }
    
    .stars-rating.disabled {
      cursor: not-allowed;
    }
    
    .star {
      color: #E2E8F0;
      transition: all 0.15s ease;
      user-select: none;
      position: relative;
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 1;
    }
    
    .star.active {
      color: #F59E0B;
      transform: scale(1.05);
      filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));
    }
    
    .star.hover {
      color: #FDBA74;
      transform: scale(1.1);
      filter: drop-shadow(0 0 12px rgba(253, 186, 116, 0.6));
    }
    
    .stars-rating.disabled .star {
      cursor: not-allowed;
    }
    
    .stars-rating:focus-within .star.active {
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.3);
      border-radius: 2px;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarsRatingComponent),
      multi: true
    }
  ]
})
export class StarsRatingComponent implements ControlValueAccessor, OnChanges {
  @Input() disabled = false;
  @Input() value = 0;
  
  stars = [1, 2, 3, 4, 5];
  hoverValue = 0;
  
  private onChange = (value: number) => {};
  private onTouched = () => {};
  
  onStarClick(rating: number): void {
    if (this.disabled) return;
    
    this.value = rating;
    this.onChange(rating);
    this.onTouched();
  }
  
  onMouseEnter(rating: number): void {
    if (this.disabled) return;
    this.hoverValue = rating;
  }
  
  onMouseLeave(): void {
    this.hoverValue = 0;
  }
  
  writeValue(value: number): void {
    this.value = value || 0;
  }
  
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && changes['value'].currentValue !== undefined) {
      this.value = changes['value'].currentValue;
    }
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        if (this.value < 5) {
          this.onStarClick(this.value + 1);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        if (this.value > 1) {
          this.onStarClick(this.value - 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.onStarClick(1);
        break;
      case 'End':
        event.preventDefault();
        this.onStarClick(5);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        // Toggle entre 0 et 1 étoile si aucune n'est sélectionnée
        this.onStarClick(this.value === 0 ? 1 : this.value);
        break;
    }
  }
}

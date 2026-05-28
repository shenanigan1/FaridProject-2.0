import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiTextInputComponent } from './text-input.component';

describe('UiTextInputComponent', () => {
  let fixture: ComponentFixture<UiTextInputComponent>;
  let component: UiTextInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiTextInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiTextInputComponent);
    component = fixture.componentInstance;
  });

  it('adds shared error class when error exists', () => {
    component.error = 'Champ obligatoire';

    expect(component.inputClasses).toBe('ff-input ff-input-error');
  });

  it('links the input to its accessible error message', () => {
    component.inputId = 'email';
    component.label = 'Email';
    component.error = 'Champ obligatoire';

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const error = fixture.debugElement.query(By.css('.ff-field-error')).nativeElement as HTMLElement;

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(error.id).toBe('email-error');
  });

  it('links the input to its hint when there is no error', () => {
    component.inputId = 'name';
    component.label = 'Name';
    component.hint = 'Use the legal name.';

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const hint = fixture.debugElement.query(By.css('.ff-field-hint')).nativeElement as HTMLElement;

    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint.id).toBe('name-hint');
  });
});

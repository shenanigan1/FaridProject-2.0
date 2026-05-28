import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiModalComponent } from '../../../../libs/shared/ui/modal/modal.component';
import { UiSelectComponent } from '../../../../libs/shared/ui/select/select.component';
import { UiTextareaComponent } from '../../../../libs/shared/ui/textarea/textarea.component';
import { UiTextInputComponent } from '../../../../libs/shared/ui/text-input/text-input.component';

describe('shared form controls accessibility', () => {
  it('links text input errors with aria-describedby', async () => {
    await TestBed.configureTestingModule({
      imports: [UiTextInputComponent],
    }).compileComponents();

    const fixture: ComponentFixture<UiTextInputComponent> =
      TestBed.createComponent(UiTextInputComponent);
    fixture.componentInstance.inputId = 'email';
    fixture.componentInstance.label = 'Email';
    fixture.componentInstance.error = 'Champ obligatoire';
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const error = fixture.debugElement.query(By.css('.ff-field-error')).nativeElement as HTMLElement;

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
    expect(error.id).toBe('email-error');
  });

  it('links select errors with aria-describedby', async () => {
    await TestBed.configureTestingModule({
      imports: [UiSelectComponent],
    }).compileComponents();

    const fixture: ComponentFixture<UiSelectComponent> = TestBed.createComponent(UiSelectComponent);
    fixture.componentInstance.selectId = 'role';
    fixture.componentInstance.label = 'Role';
    fixture.componentInstance.error = 'Champ obligatoire';
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe('role-error');
  });

  it('links textarea errors with aria-describedby', async () => {
    await TestBed.configureTestingModule({
      imports: [UiTextareaComponent],
    }).compileComponents();

    const fixture: ComponentFixture<UiTextareaComponent> =
      TestBed.createComponent(UiTextareaComponent);
    fixture.componentInstance.textareaId = 'description';
    fixture.componentInstance.label = 'Description';
    fixture.componentInstance.error = 'Champ obligatoire';
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;

    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe('description-error');
  });

  it('renders modal dialogs as non-interactive containers', async () => {
    await TestBed.configureTestingModule({
      imports: [UiModalComponent],
    }).compileComponents();

    const fixture: ComponentFixture<UiModalComponent> = TestBed.createComponent(UiModalComponent);
    fixture.componentInstance.open = true;
    fixture.componentInstance.title = 'Candidate profile';
    fixture.detectChanges();

    const dialog = fixture.debugElement.query(By.css('[role="dialog"]')).nativeElement as HTMLElement;

    expect(dialog.tagName).toBe('DIV');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(dialog);
  });
});

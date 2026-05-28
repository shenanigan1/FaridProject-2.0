import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiTextareaComponent } from './textarea.component';

describe('UiTextareaComponent', () => {
  let fixture: ComponentFixture<UiTextareaComponent>;
  let component: UiTextareaComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiTextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiTextareaComponent);
    component = fixture.componentInstance;
  });

  it('links the textarea to its accessible error message', () => {
    component.textareaId = 'description';
    component.label = 'Description';
    component.error = 'Champ obligatoire';

    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    const error = fixture.debugElement.query(By.css('.ff-field-error')).nativeElement as HTMLElement;

    expect(textarea.id).toBe('description');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe(error.id);
    expect(error.id).toBe('description-error');
  });
});

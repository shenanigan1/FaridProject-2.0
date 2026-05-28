import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiSelectComponent } from './select.component';

describe('UiSelectComponent', () => {
  let fixture: ComponentFixture<UiSelectComponent>;
  let component: UiSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiSelectComponent);
    component = fixture.componentInstance;
  });

  it('uses shared select classes by default', () => {
    expect(component.selectClasses).toBe('ff-input mt-1');
  });

  it('adds shared error class when error is set', () => {
    component.error = 'Required';

    expect(component.selectClasses).toBe('ff-input mt-1 ff-input-error');
  });

  it('links the select to its accessible error message', () => {
    component.selectId = 'role';
    component.label = 'Role';
    component.error = 'Champ obligatoire';

    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;
    const error = fixture.debugElement.query(By.css('.ff-field-error')).nativeElement as HTMLElement;

    expect(select.id).toBe('role');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe(error.id);
    expect(error.id).toBe('role-error');
  });
});

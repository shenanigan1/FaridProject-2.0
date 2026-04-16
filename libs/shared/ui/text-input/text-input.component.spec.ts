import { UiTextInputComponent } from './text-input.component';

describe('UiTextInputComponent', () => {
  let component: UiTextInputComponent;

  beforeEach(() => {
    component = new UiTextInputComponent();
  });

  it('returns default control classes when no error', () => {
    expect(component.inputClasses).toBe('ff-input mt-1');
  });

  it('adds error class when error exists', () => {
    component.error = 'Invalid value';

    expect(component.inputClasses).toBe('ff-input mt-1 ff-input-error');
  });
});

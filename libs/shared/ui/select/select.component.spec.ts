import { UiSelectComponent } from './select.component';

describe('UiSelectComponent', () => {
  let component: UiSelectComponent;

  beforeEach(() => {
    component = new UiSelectComponent();
  });

  it('uses shared select classes by default', () => {
    expect(component.selectClasses).toBe('ff-input mt-1');
  });

  it('adds shared error class when error is set', () => {
    component.error = 'Required';

    expect(component.selectClasses).toBe('ff-input mt-1 ff-input-error');
  });
});

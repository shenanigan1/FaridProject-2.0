import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TestsAdminPage } from './tests-admin.page';

describe('TestsAdminPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestsAdminPage],
    })
      .overrideComponent(TestsAdminPage, {
        remove: {
          imports: [],
        },
        set: {
          template: `
            <button data-testid="switch-tests" (click)="setView('tests')">Tests</button>
            <button data-testid="switch-templates" (click)="setView('templates')">Templates</button>
            @if (isTestsView()) {
              <div data-testid="tests-pane">tests-pane</div>
            } @else {
              <div data-testid="templates-pane">templates-pane</div>
            }
          `,
        },
      })
      .compileComponents();
  });

  it('defaults to tests view', () => {
    const fixture = TestBed.createComponent(TestsAdminPage);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="tests-pane"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-testid="templates-pane"]'))).toBeFalsy();
  });

  it('switches to templates view', () => {
    const fixture = TestBed.createComponent(TestsAdminPage);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('[data-testid="switch-templates"]'));
    button.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="tests-pane"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-testid="templates-pane"]'))).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiButtonPrimaryComponent } from './button-primary.component';

describe('UiButtonPrimaryComponent', () => {
  let fixture: ComponentFixture<UiButtonPrimaryComponent>;
  let component: UiButtonPrimaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiButtonPrimaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiButtonPrimaryComponent);
    component = fixture.componentInstance;
  });

  it('renders label input when provided', () => {
    component.label = 'Apply now';

    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Apply now');
  });

  it('emits clicked when the button is pressed', () => {
    spyOn(component.clicked, 'emit');

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
    button.click();

    expect(component.clicked.emit).toHaveBeenCalledTimes(1);
  });
});

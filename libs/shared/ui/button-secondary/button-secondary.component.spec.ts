import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiButtonSecondaryComponent } from './button-secondary.component';

describe('UiButtonSecondaryComponent', () => {
  let fixture: ComponentFixture<UiButtonSecondaryComponent>;
  let component: UiButtonSecondaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiButtonSecondaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiButtonSecondaryComponent);
    component = fixture.componentInstance;
  });

  it('renders label input when provided', () => {
    component.label = 'Back to offers';

    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Back to offers');
  });

  it('emits clicked when pressed', () => {
    spyOn(component.clicked, 'emit');

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
    button.click();

    expect(component.clicked.emit).toHaveBeenCalledTimes(1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TopBarComponent } from './top-bar';

describe('TopBarComponent', () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    component.title = 'Recruitment Overview';
    component.user = { fullName: 'Test User' };
    fixture.detectChanges();
  });

  it('renders desktop console identity and user initials', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Recruitment Overview');
    expect(text).toContain('TU');
  });

  it('emits editProfile and logout from user menu actions', () => {
    spyOn(component.editProfile, 'emit');
    spyOn(component.logout, 'emit');

    fixture.debugElement.query(By.css('button[aria-label="Open user menu"]')).nativeElement.click();
    fixture.detectChanges();

    const menuButtons = fixture.debugElement.queryAll(By.css('.ff-topbar__menu-action'));
    menuButtons[0].nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('button[aria-label="Open user menu"]')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.queryAll(By.css('.ff-topbar__menu-action'))[1].nativeElement.click();

    expect(component.editProfile.emit).toHaveBeenCalledTimes(1);
    expect(component.logout.emit).toHaveBeenCalledTimes(1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TopBarComponent } from './top-bar';

describe('TopBar', () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits editProfile and logout from user menu actions', () => {
    component.user = { fullName: 'Test User' };
    fixture.detectChanges();

    spyOn(component.editProfile, 'emit');
    spyOn(component.logout, 'emit');

    const avatarButton = fixture.debugElement.query(
      By.css('button[aria-label="Open navigation menu"]'),
    );
    avatarButton.nativeElement.click();
    fixture.detectChanges();

    const menuButtons = fixture.debugElement.queryAll(By.css('div.absolute button'));
    menuButtons[0].nativeElement.click();
    fixture.detectChanges();

    avatarButton.nativeElement.click();
    fixture.detectChanges();
    const refreshedButtons = fixture.debugElement.queryAll(By.css('div.absolute button'));
    refreshedButtons[1].nativeElement.click();

    expect(component.editProfile.emit).toHaveBeenCalledTimes(1);
    expect(component.logout.emit).toHaveBeenCalledTimes(1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { APP_ICONS } from '@shared/icons/app-icons';

import { MenuBarComponent } from './menu-bar';

describe('MenuBarComponent', () => {
  let component: MenuBarComponent;
  let fixture: ComponentFixture<MenuBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuBarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuBarComponent);
    component = fixture.componentInstance;
    component.items = [
      { label: 'Home', icon: APP_ICONS.home, route: '/dashboard' },
      { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
    ];
  });

  it('renders provided navigation items', () => {
    fixture.detectChanges();

    const links = fixture.debugElement.queryAll(By.css('.ff-menu__link'));

    expect(links.length).toBe(2);
    expect((links[0].nativeElement as HTMLAnchorElement).textContent).toContain('Home');
  });

  it('applies the mobile variant class', () => {
    component.variant = 'mobile';
    fixture.detectChanges();

    const mobileNav = fixture.debugElement.query(By.css('.ff-menu--mobile'));

    expect(mobileNav).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '@auth/services/auth-session.service';
import { RolesAdminService } from '@features/roles/services/roles-admin.service';
import { ContactPage } from './contact.page';

describe('ContactPage', () => {
  let fixture: ComponentFixture<ContactPage>;
  let component: ContactPage;
  let sessionSpy: jasmine.SpyObj<AuthSessionService>;
  let rolesAdminSpy: jasmine.SpyObj<RolesAdminService>;

  beforeEach(async () => {
    sessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['loadMeOnce']);
    sessionSpy.loadMeOnce.and.returnValue(
      of({
        id: 99,
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      }),
    );
    rolesAdminSpy = jasmine.createSpyObj<RolesAdminService>('RolesAdminService', [
      'listUsers',
      'createUser',
    ]);
    rolesAdminSpy.listUsers.and.returnValue(
      of([
        {
          id: 1,
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'driver',
          is_active: true,
        },
        {
          id: 2,
          email: 'sarah@example.com',
          first_name: 'Sarah',
          last_name: 'Connor',
          role: 'manager',
          is_active: true,
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: sessionSpy },
        { provide: RolesAdminService, useValue: rolesAdminSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filters contacts by selected role', () => {
    component.selectedRole.set('driver');
    fixture.detectChanges();

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].first_name).toBe('John');
  });

  it('shows a create contact action for admin users', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(component.canManageContacts()).toBeTrue();
    expect(text).toContain('Create Contact');
  });

  it('hides creation for HR users', () => {
    sessionSpy.loadMeOnce.and.returnValue(
      of({
        id: 98,
        email: 'hr@example.com',
        first_name: 'HR',
        last_name: 'User',
        role: 'hr',
      }),
    );
    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(component.canManageContacts()).toBeFalse();
    expect(text).not.toContain('Create Contact');
  });
});

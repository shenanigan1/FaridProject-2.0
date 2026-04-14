import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RolesAdminService } from '@features/roles/services/roles-admin.service';
import { ContactPage } from './contact.page';

describe('ContactPage', () => {
  let fixture: ComponentFixture<ContactPage>;
  let component: ContactPage;

  beforeEach(async () => {
    const rolesAdminSpy = jasmine.createSpyObj<RolesAdminService>('RolesAdminService', ['listUsers']);
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
      providers: [{ provide: RolesAdminService, useValue: rolesAdminSpy }],
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
});

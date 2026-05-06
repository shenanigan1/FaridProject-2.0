import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RolesAdminPage } from './roles-admin.page';
import { RolesAdminService } from '@features/roles/services/roles-admin.service';

describe('RolesAdminPage', () => {
  let fixture: ComponentFixture<RolesAdminPage>;
  let component: RolesAdminPage;
  let apiSpy: jasmine.SpyObj<RolesAdminService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<RolesAdminService>('RolesAdminService', [
      'listUsers',
      'createUser',
      'updateUserRole',
      'activateUser',
      'deactivateUser',
    ]);
    apiSpy.listUsers.and.returnValue(
      of([
        {
          id: 1,
          email: 'manager@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
          role: 'manager',
          is_active: true,
        },
      ]),
    );
    apiSpy.updateUserRole.and.returnValue(
      of({
        id: 1,
        email: 'manager@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'hr',
        is_active: true,
      }),
    );
    apiSpy.createUser.and.returnValue(
      of({
        id: 2,
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'manager',
        is_active: true,
      }),
    );
    apiSpy.activateUser.and.returnValue(of({ status: 'user activated' }));
    apiSpy.deactivateUser.and.returnValue(of({ status: 'user deactivated' }));

    await TestBed.configureTestingModule({
      imports: [RolesAdminPage],
      providers: [provideRouter([]), { provide: RolesAdminService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('auto-saves role when role dropdown changes', () => {
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'hr';
    select.appendChild(option);
    select.value = 'hr';
    const event = { target: select } as unknown as Event;

    component.onRoleChange(component.users[0], event);

    expect(apiSpy.updateUserRole).toHaveBeenCalledWith(1, 'hr');
  });
});


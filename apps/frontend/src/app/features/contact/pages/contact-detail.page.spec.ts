import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RolesAdminService } from '@features/roles/services/roles-admin.service';
import { ContactDetailPage } from './contact-detail.page';

describe('ContactDetailPage', () => {
  let fixture: ComponentFixture<ContactDetailPage>;
  let component: ContactDetailPage;

  beforeEach(async () => {
    const rolesAdminSpy = jasmine.createSpyObj<RolesAdminService>('RolesAdminService', [
      'listUsers',
      'updateUserRole',
      'activateUser',
      'deactivateUser',
    ]);

    rolesAdminSpy.listUsers.and.returnValue(
      of([
        {
          id: 5,
          email: 'jp@example.com',
          first_name: 'Jean-Pierre',
          last_name: 'Lambert',
          role: 'driver',
          is_active: true,
        },
      ]),
    );
    rolesAdminSpy.updateUserRole.and.returnValue(
      of({
        id: 5,
        email: 'jp@example.com',
        first_name: 'Jean-Pierre',
        last_name: 'Lambert',
        role: 'manager',
        is_active: true,
      }),
    );
    rolesAdminSpy.deactivateUser.and.returnValue(of({ status: 'ok' }));
    rolesAdminSpy.activateUser.and.returnValue(of({ status: 'ok' }));

    await TestBed.configureTestingModule({
      imports: [ContactDetailPage],
      providers: [
        provideRouter([]),
        { provide: RolesAdminService, useValue: rolesAdminSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => (key === 'id' ? '5' : null) } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads contact and toggles active status', () => {
    expect(component.contact()?.id).toBe(5);

    component.toggleActive();
    fixture.detectChanges();

    expect(component.contact()?.is_active).toBeFalse();
  });
});

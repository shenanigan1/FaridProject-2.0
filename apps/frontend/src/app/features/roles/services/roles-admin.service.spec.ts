import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RolesAdminService } from './roles-admin.service';

describe('RolesAdminService', () => {
  let service: RolesAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RolesAdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RolesAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists users', () => {
    service.listUsers().subscribe((users) => {
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('admin@example.com');
    });

    const req = httpMock.expectOne('/api/users/');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 1,
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
      },
    ]);
  });

  it('activates and deactivates user', () => {
    service.deactivateUser(5).subscribe();
    const deactivateReq = httpMock.expectOne('/api/users/5/deactivate/');
    expect(deactivateReq.request.method).toBe('POST');
    deactivateReq.flush({ status: 'user deactivated' });

    service.activateUser(5).subscribe();
    const activateReq = httpMock.expectOne('/api/users/5/activate/');
    expect(activateReq.request.method).toBe('POST');
    activateReq.flush({ status: 'user activated' });
  });

  it('updates contact information and role', () => {
    service
      .updateUser(7, {
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User',
        role: 'director',
      })
      .subscribe((user) => {
        expect(user.role).toBe('director');
      });

    const req = httpMock.expectOne('/api/users/7/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'User',
      role: 'director',
    });
    req.flush({
      id: 7,
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'User',
      role: 'director',
      is_active: true,
    });
  });
});


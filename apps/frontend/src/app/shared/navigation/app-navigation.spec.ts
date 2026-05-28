import { buildAppNavigation, getRoleHomeRoute, isRecruitmentRole } from './app-navigation';

describe('app navigation', () => {
  it('maps each authenticated role to its dedicated home route', () => {
    expect(getRoleHomeRoute('admin')).toBe('/admin');
    expect(getRoleHomeRoute('director')).toBe('/direction');
    expect(getRoleHomeRoute('hr')).toBe('/dashboard');
    expect(getRoleHomeRoute('manager')).toBe('/manager');
    expect(getRoleHomeRoute('employee')).toBe('/employee');
    expect(getRoleHomeRoute('driver')).toBe('/employee');
    expect(getRoleHomeRoute('candidate')).toBe('/candidate-portal');
    expect(getRoleHomeRoute(null)).toBe('/login');
  });

  it('builds the admin navigation with system settings', () => {
    expect(buildAppNavigation('admin').map((item) => item.label)).toEqual([
      'Dashboard',
      'Contacts',
      'Tests',
      'Jobs',
      'Rôles',
    ]);
    expect(buildAppNavigation('admin').map((item) => item.route)).toEqual([
      '/admin',
      '/contact',
      '/tests',
      '/jobs',
      '/roles',
    ]);
  });

  it('builds the direction navigation without admin-only role management', () => {
    expect(buildAppNavigation('director').map((item) => item.label)).toEqual([
      'Dashboard',
      'Contacts',
      'Tests',
      'Jobs',
      'Reporting',
    ]);
    expect(buildAppNavigation('director').map((item) => item.route)).toEqual([
      '/direction',
      '/contact',
      '/tests',
      '/jobs',
      '/reporting',
    ]);
  });

  it('builds the HR navigation around the recruiting dashboard', () => {
    expect(buildAppNavigation('hr').map((item) => item.route)).toEqual([
      '/dashboard',
      '/contact',
      '/tests',
      '/jobs',
    ]);
    expect(isRecruitmentRole('hr')).toBeTrue();
  });

  it('keeps employee users on employee-only entries', () => {
    expect(buildAppNavigation('employee').map((item) => item.route)).toEqual([
      '/employee',
      '/employee/tests',
      '/profile',
    ]);
    expect(buildAppNavigation('driver').map((item) => item.route)).toEqual([
      '/employee',
      '/employee/tests',
      '/profile',
    ]);
    expect(isRecruitmentRole('candidate')).toBeFalse();
  });

  it('builds the manager MVP navigation without admin-only entries', () => {
    expect(buildAppNavigation('manager').map((item) => item.label)).toEqual([
      'Home',
      'Jobs',
      'Tests',
      'Profil',
    ]);
    expect(buildAppNavigation('manager').map((item) => item.route)).toEqual([
      '/manager',
      '/jobs',
      '/manager/tests',
      '/profile',
    ]);
  });
});

import { buildAppNavigation, isRecruitmentRole } from './app-navigation';

describe('app navigation', () => {
  it('builds the four Figma navigation entries for recruitment roles', () => {
    expect(buildAppNavigation('admin').map((item) => item.label)).toEqual([
      'Home',
      'Contacts',
      'Tests',
      'Jobs',
    ]);
    expect(buildAppNavigation('admin').map((item) => item.route)).toEqual([
      '/dashboard',
      '/contact',
      '/tests',
      '/jobs',
    ]);
  });

  it('keeps non recruitment users on the focused workspace entry', () => {
    expect(buildAppNavigation('employee').map((item) => item.route)).toEqual(['/dashboard']);
    expect(isRecruitmentRole('candidate')).toBeFalse();
  });

  it('builds the manager MVP navigation without admin-only entries', () => {
    expect(buildAppNavigation('manager').map((item) => item.label)).toEqual([
      'Home',
      'Jobs',
      'Tests',
      'Profile',
    ]);
    expect(buildAppNavigation('manager').map((item) => item.route)).toEqual([
      '/manager',
      '/jobs',
      '/manager/tests',
      '/profile',
    ]);
  });
});

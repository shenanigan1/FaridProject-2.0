import { APP_ICONS, type AppIcon } from '@shared/icons/app-icons';

export type AppNavigationRole =
  | 'admin'
  | 'hr'
  | 'director'
  | 'manager'
  | 'candidate'
  | 'employee'
  | 'driver'
  | string
  | null
  | undefined;

export interface AppNavigationItem {
  label: string;
  icon: AppIcon;
  route: string;
}

const hrNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', icon: APP_ICONS.home, route: '/dashboard' },
  { label: 'Contacts', icon: APP_ICONS.users, route: '/contact' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/tests' },
  { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
];

const adminNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', icon: APP_ICONS.dashboard, route: '/admin' },
  { label: 'Contacts', icon: APP_ICONS.users, route: '/contact' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/tests' },
  { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
  { label: 'Rôles', icon: APP_ICONS.settings, route: '/roles' },
];

const directionNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', icon: APP_ICONS.dashboard, route: '/direction' },
  { label: 'Contacts', icon: APP_ICONS.users, route: '/contact' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/tests' },
  { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
  { label: 'Reporting', icon: APP_ICONS.preview, route: '/reporting' },
];

const managerNavigation: AppNavigationItem[] = [
  { label: 'Home', icon: APP_ICONS.home, route: '/manager' },
  { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/manager/tests' },
  { label: 'Profil', icon: APP_ICONS.user, route: '/profile' },
];

const employeeNavigation: AppNavigationItem[] = [
  { label: 'Home', icon: APP_ICONS.home, route: '/employee' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/employee/tests' },
  { label: 'Profil', icon: APP_ICONS.user, route: '/profile' },
];

export function isRecruitmentRole(role: AppNavigationRole): boolean {
  return role === 'admin' || role === 'hr' || role === 'director' || role === 'manager';
}

export function getRoleHomeRoute(role: AppNavigationRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'director':
      return '/direction';
    case 'hr':
      return '/dashboard';
    case 'manager':
      return '/manager';
    case 'employee':
    case 'driver':
      return '/employee';
    case 'candidate':
      return '/candidate-portal';
    default:
      return '/login';
  }
}

export function buildAppNavigation(role: AppNavigationRole): AppNavigationItem[] {
  switch (role) {
    case 'admin':
      return adminNavigation;
    case 'director':
      return directionNavigation;
    case 'hr':
      return hrNavigation;
    case 'manager':
      return managerNavigation;
    case 'employee':
    case 'driver':
      return employeeNavigation;
    default:
      return [];
  }
}

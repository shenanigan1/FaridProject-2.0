import { APP_ICONS, type AppIcon } from '@shared/icons/app-icons';

export type AppNavigationRole =
  | 'admin'
  | 'hr'
  | 'director'
  | 'manager'
  | 'candidate'
  | 'employee'
  | string
  | null
  | undefined;

export interface AppNavigationItem {
  label: string;
  icon: AppIcon;
  route: string;
}

const figmaNavigation: AppNavigationItem[] = [
  { label: 'Home', icon: APP_ICONS.home, route: '/dashboard' },
  { label: 'Contacts', icon: APP_ICONS.users, route: '/contact' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/tests' },
  { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
];

const managerNavigation: AppNavigationItem[] = [
  { label: 'Home', icon: APP_ICONS.home, route: '/manager' },
  { label: 'Jobs', icon: APP_ICONS.jobs, route: '/jobs' },
  { label: 'Tests', icon: APP_ICONS.clipboard_check, route: '/manager/tests' },
  { label: 'Profile', icon: APP_ICONS.user, route: '/profile' },
];

export function isRecruitmentRole(role: AppNavigationRole): boolean {
  return role === 'admin' || role === 'hr' || role === 'director' || role === 'manager';
}

export function buildAppNavigation(role: AppNavigationRole): AppNavigationItem[] {
  if (role === 'manager') {
    return managerNavigation;
  }

  return isRecruitmentRole(role) ? figmaNavigation : [figmaNavigation[0]];
}

import {
  LucideBriefcase,
  LucideBuilding2,
  LucideFileText,
  LucideHouse,
  LucideLayoutGrid,
  LucideLock,
  LucideLogIn,
  LucideMail,
  LucideShield,
  LucideTruck,
  LucideUsers,
  LucideLogOut,
  LucideAlertTriangle,
  LucideArrowLeft,
  LucideClipboardCheck,
  LucidePresentation,
} from '@lucide/angular';

export const APP_ICONS = {
  brand: LucideTruck,
  loginEmail: LucideMail,
  loginPassword: LucideLock,
  loginSubmit: LucideLogIn,
  dashboard: LucideLayoutGrid,
  users: LucideUsers,
  company: LucideBuilding2,
  positions: LucideBriefcase,
  documents: LucideFileText,
  security: LucideShield,
  home: LucideHouse,
  logout: LucideLogOut,
  warning: LucideAlertTriangle,
  back: LucideArrowLeft,
  clipboard_check: LucideClipboardCheck,
  preview: LucidePresentation
} as const;

export type AppIcon = (typeof APP_ICONS)[keyof typeof APP_ICONS];

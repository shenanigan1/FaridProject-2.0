// app-icons.ts
import {
  LucideAlertTriangle,
  LucideArrowLeft,
  LucideBadgeCheck,
  LucideBell,
  LucideBriefcase,
  LucideBuilding2,
  LucideClipboardCheck,
  LucideClipboardList,
  LucideEye,
  LucideFileText,
  LucideHistory,
  LucideHouse,
  LucideInbox,
  LucideLayoutGrid,
  LucideLock,
  LucideLogIn,
  LucideLogOut,
  LucideMail,
  LucideMapPin,
  LucideMenu,
  LucideMoreVertical,
  LucidePlus,
  LucidePresentation,
  LucideSearch,
  LucideSettings,
  LucideShield,
  LucideTruck,
  LucideUser,
  LucideUsers,
} from '@lucide/angular';

export const APP_ICONS = {
  brand: LucideTruck,

  loginEmail: LucideMail,
  loginPassword: LucideLock,
  loginSubmit: LucideLogIn,
  passwordShow: LucideEye,

  dashboard: LucideLayoutGrid,
  home: LucideHouse,
  logout: LucideLogOut,
  back: LucideArrowLeft,
  menu: LucideMenu,
  bell: LucideBell,
  search: LucideSearch,
  mapPin: LucideMapPin,
  plus: LucidePlus,
  moreVertical: LucideMoreVertical,

  users: LucideUsers,
  user: LucideUser,
  company: LucideBuilding2,

  positions: LucideBriefcase,
  jobs: LucideBriefcase,
  documents: LucideFileText,

  security: LucideShield,
  warning: LucideAlertTriangle,

  clipboard_check: LucideClipboardCheck,
  clipboard_list: LucideClipboardList,

  preview: LucidePresentation,

  inbox: LucideInbox,
  history: LucideHistory,
  settings: LucideSettings,
  badge_check: LucideBadgeCheck,
} as const;

export type AppIcon = (typeof APP_ICONS)[keyof typeof APP_ICONS];

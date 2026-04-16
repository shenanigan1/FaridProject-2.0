import type { Config } from 'tailwindcss';
import { fleetflowTailwindPreset } from './libs/shared/tailwinds/preset';

export default {
  presets: [fleetflowTailwindPreset],
  content: [
    './apps/frontend/src/**/*.{html,ts,scss}',
    './apps/candidates/src/**/*.{html,ts,scss}',
    './shared-ui/**/*.{html,ts,scss}',
  ],
} satisfies Config;

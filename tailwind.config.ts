import type { Config } from 'tailwindcss';
import { fleetflowTailwindPreset } from './libs/shared/tailwinds/preset';

export default {
  presets: [fleetflowTailwindPreset],
  content: [
    './apps/frontend/src/**/*.{html,ts,scss}',
    './apps/candidates/src/**/*.{html,ts,scss}',
    './libs/shared/**/*.{html,ts,scss}',
  ],

  theme: {
    extend: {
      colors: {
        debugred: '#ff0000',
      },
    },
  },

  
} satisfies Config;
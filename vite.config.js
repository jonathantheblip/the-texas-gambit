import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed as a GitHub Pages *project* site at /the-texas-gambit/.
// `base` makes built asset URLs resolve under that subpath.
// In dev, base is '/' so localhost works normally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/the-texas-gambit/' : '/',
  plugins: [react()],
}));

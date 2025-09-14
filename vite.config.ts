import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// Read version from package.json at build time
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});

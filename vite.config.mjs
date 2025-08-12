import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: ['src/components/**/*'],
      exclude: ['node_modules', 'test', 'src/config.js', 'src/index.*', 'src/App.jsx'],
      extension: ['.js', '.jsx'],
      cypress: true,
      requireEnv: false,
    }),
  ],
});

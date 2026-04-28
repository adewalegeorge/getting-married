import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://yb-wedding.pages.dev',
  integrations: [tailwind()],
  output: 'static',
});

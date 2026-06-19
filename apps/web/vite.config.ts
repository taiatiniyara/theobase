import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'svelte-in-node-modules',
          setup(build) {
            build.onLoad({ filter: /\.svelte$/ }, () => ({
              contents: 'export default {}',
              loader: 'js',
            }));
          },
        },
      ],
    },
  },
  ssr: {
    noExternal: [
      '@lucide/svelte',
      'mode-watcher',
      'bits-ui',
      'svelte-sonner',
      'paneforge',
      'runed',
    ],
  },
});

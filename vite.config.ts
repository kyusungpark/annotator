import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [react(), dts({ include: 'src' })],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        components: path.resolve(__dirname, 'src/components/index.ts'),
        hooks: path.resolve(__dirname, 'src/hooks/index.ts'),
        types: path.resolve(__dirname, 'src/types/index.ts'),
        storage: path.resolve(__dirname, 'src/storage/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@radix-ui/react-popover',
        '@radix-ui/react-primitive',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/primitive',
        '@radix-ui/react-use-controllable-state',
        '@radix-ui/react-use-callback-ref',
        '@radix-ui/react-use-layout-effect',
        '@radix-ui/react-use-previous',
        '@radix-ui/react-slot',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'lucide-react',
      ],
      output: [
        {
          dir: 'dist',
          entryFileNames: '[name].esm.js',
          format: 'es',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'React',
          },
        },
        {
          dir: 'dist',
          entryFileNames: '[name].cjs.js',
          format: 'cjs',
          preserveModules: false,
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'React',
          },
        },
      ],
    },
    target: 'ES2020',
    sourcemap: true,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})


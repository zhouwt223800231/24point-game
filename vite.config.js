import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './', // GitHub Pages 子路径部署需要相对路径
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
})


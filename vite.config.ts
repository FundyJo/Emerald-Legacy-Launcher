import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  optimizeDeps: {
    entries: ['index.html'], 
    exclude: ['bin', 'game', 'src-tauri'] 
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**", "**/bin/**", "**/game/**", "**/*.app/**"], 
    }
  },
});
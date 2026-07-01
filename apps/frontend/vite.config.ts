import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@gradusy24/shared": path.resolve(__dirname, "../../packages/shared/src")
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});

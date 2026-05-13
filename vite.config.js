import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
          "vendor-charts": ["recharts"],
          // Role-based components
          admin: ["./src/components/AdminPanel"],
          teacher: ["./src/components/TeacherDashboard"],
          student: ["./src/components/StudentDashboard"],
          parent: ["./src/components/ParentDashboard"],
          advisor: ["./src/components/AdvisorDashboard"],
          chat: ["./src/components/ChatComponent"],
        },
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: true,
    },
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "framer-motion",
      "recharts",
      "lucide-react",
    ],
  },
});

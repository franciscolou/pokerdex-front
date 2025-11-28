import { defineConfig } from "vite";
import { resolve } from "path";

const rootDir = new URL(".", import.meta.url).pathname;

export default defineConfig({
  server: {
    port: 5173,
    open: "/src/pages/group_list.html",
    proxy: {
      "/api": {
        target: "https://pokerdex-back.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
        host: '0.0.0.0', 
        port: process.env.PORT || 4173,
        open: "/src/pages/group_list.html",
        proxy: {
          "/api": {
            target: "https://pokerdex-back.onrender.com",
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ""),
          },
        },
        allowedHosts: ['pokerdex-6yws.onrender.com'], 
    },

  build: {
    rollupOptions: {
      input: {
        header: resolve(rootDir, "src/components/header.html"),
        footer: resolve(rootDir, "src/components/footer.html"),
        group_manage: resolve(rootDir, "src/pages/group_manage.html"),
        password_reset: resolve(rootDir, "src/pages/password_reset.html"),
        password_reset_confirm: resolve(rootDir, "src/pages/password_reset_confirm.html"),
        index: resolve(rootDir, "src/pages/group_list.html"),
        group_detail: resolve(rootDir, "src/pages/group_detail.html"),
        game_manage: resolve(rootDir, "src/pages/game_manage.html"),
        game_detail: resolve(rootDir, "src/pages/game_detail.html"),
        participation_add: resolve(rootDir, "src/pages/participation_add.html"),
        login: resolve(rootDir, "src/pages/login.html"),
        signup: resolve(rootDir, "src/pages/signup.html"),
      },
    },
  },
});






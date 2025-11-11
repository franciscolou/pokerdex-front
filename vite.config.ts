import { defineConfig } from "vite";
import { resolve } from "path";

const rootDir = new URL(".", import.meta.url).pathname;

export default defineConfig({
  server: {
    port: 5173,
    open: "/src/pages/group_list.html",
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },

  build: {
    rollupOptions: {
      input: {
        group_list: resolve(rootDir, "src/pages/group_list.html"),
        group_detail: resolve(rootDir, "src/pages/group_detail.html"),
        game_create: resolve(rootDir, "src/pages/game_create.html"),
        game_detail: resolve(rootDir, "src/pages/game_detail.html"),
        participation_add: resolve(rootDir, "src/pages/participation_add.html"),
        login: resolve(rootDir, "src/pages/login.html"),
        signup: resolve(rootDir, "src/pages/signup.html"),
      },
    },
  },
});

import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    server: {
        host: "127.0.0.1",
        port: 5173,
        hmr: {
            protocol: "ws",
            host: "127.0.0.1",
        },
    },
});

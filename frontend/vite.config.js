import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        svgr(),
        //for prod_check
        basicSsl(),
    ],
    build: {
        manifest: true,
        // rollupOptions: {
        //     input: "../index.js",
        // },
    },
});

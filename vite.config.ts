import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

const BACKEND = "http://193.233.246.230:8080";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	/** Empty = same-origin `/api` (Vite proxy locally, Vercel rewrite in preview/prod). */
	const api = env.VITE_API_URL ?? "";

	return {
		plugins: [react()],
		define: {
			__IS_DEV__: JSON.stringify(mode !== "production"),
			__API__: JSON.stringify(api),
		},
		resolve: {
			alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
		},
		server: {
			proxy: {
				"/api": {
					target: BACKEND,
					changeOrigin: true,
				},
			},
		},
		preview: {
			proxy: {
				"/api": {
					target: BACKEND,
					changeOrigin: true,
				},
			},
		},
	};
});

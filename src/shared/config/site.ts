/** Without trailing slash. Override via VITE_SITE_ORIGIN. */
export const SITE_ORIGIN = (
	(import.meta.env.VITE_SITE_ORIGIN as string | undefined) ||
	(typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")
).replace(/\/$/, "");

export const SITE_NAME = "Financial Assistant";

export const DEFAULT_OG_IMAGE_PATH = "/og/og-default.jpg";

export const SITE_LOCALES = ["ru", "en"] as const;

export type SiteLocale = (typeof SITE_LOCALES)[number];

export const absoluteUrl = (path: string) => {
	if (/^https?:\/\//i.test(path)) return path;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${SITE_ORIGIN}${normalized}`;
};

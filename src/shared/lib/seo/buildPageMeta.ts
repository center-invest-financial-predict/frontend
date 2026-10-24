import { absoluteUrl, SITE_LOCALES } from "@/shared/config/site";
import { AlternateLink, PageMetaInput, PageMetaTags } from "./types";

const localeToOg = (locale: string) => {
	if (locale.startsWith("ru")) return "ru_RU";
	if (locale.startsWith("en")) return "en_US";
	return locale;
};

const stripTrackingQuery = (url: string) => {
	try {
		const parsed = new URL(url);
		["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach(
			(key) => parsed.searchParams.delete(key),
		);
		parsed.hash = "";
		return `${parsed.origin}${parsed.pathname}${parsed.search}`;
	} catch {
		return url;
	}
};

const buildAlternates = (canonicalUrl: string, locales: string[]): AlternateLink[] => {
	const path = (() => {
		try {
			return new URL(canonicalUrl).pathname || "/";
		} catch {
			return "/";
		}
	})();

	const base = absoluteUrl(path);
	const links: AlternateLink[] = locales.map((lng) => ({
		hreflang: lng,
		href: `${base}${base.includes("?") ? "&" : "?"}lng=${lng}`,
	}));

	links.push({
		hreflang: "x-default",
		href: base,
	});

	return links;
};

export const buildPageMeta = (input: PageMetaInput): PageMetaTags => {
	const title = input.title.trim();
	const description = input.description.trim();
	const ogTitle = (input.ogTitle || title).trim();
	const ogDescription = (input.ogDescription || description).trim();
	const canonicalUrl = stripTrackingQuery(input.canonicalUrl);
	const ogImage = absoluteUrl(input.ogImage);
	const locales = input.locales?.length ? input.locales : [...SITE_LOCALES];

	return {
		title,
		description,
		canonicalUrl,
		robots: input.noIndex ? "noindex, nofollow" : undefined,
		og: {
			title: ogTitle,
			description: ogDescription,
			url: canonicalUrl,
			type: input.ogType || "website",
			image: ogImage,
			locale: localeToOg(input.locale),
			siteName: input.siteName,
		},
		twitter: {
			card: "summary_large_image",
			title: ogTitle,
			description: ogDescription,
			image: ogImage,
		},
		alternates: input.noIndex ? [] : buildAlternates(canonicalUrl, locales),
		jsonLd: input.jsonLd,
	};
};

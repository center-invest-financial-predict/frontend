import { FC, memo, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
	absoluteUrl,
	DEFAULT_OG_IMAGE_PATH,
	SITE_LOCALES,
	SITE_NAME,
	SITE_ORIGIN,
} from "@/shared/config/site";
import {
	applyPageMeta,
	buildPageMeta,
	isNoIndexRoute,
	resolveSeoRoute,
} from "@/shared/lib/seo";

export const PageHead: FC = memo(() => {
	const { t, i18n } = useTranslation("seo");
	const location = useLocation();
	const routeKey = resolveSeoRoute(location.pathname);
	const locale = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

	useLayoutEffect(() => {
		const siteName = t("siteName", { defaultValue: SITE_NAME });
		const meta = buildPageMeta({
			title: t(`pages.${routeKey}.title`),
			description: t(`pages.${routeKey}.description`),
			ogTitle: t(`pages.${routeKey}.ogTitle`),
			ogDescription: t(`pages.${routeKey}.ogDescription`),
			canonicalUrl: `${SITE_ORIGIN}${location.pathname || "/"}`,
			ogImage: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
			ogType: "website",
			siteName,
			locale,
			locales: [...SITE_LOCALES],
			noIndex: isNoIndexRoute(routeKey),
		});
		applyPageMeta(meta);
		document.documentElement.lang = locale;
	}, [t, routeKey, locale, location.pathname]);

	return null;
});

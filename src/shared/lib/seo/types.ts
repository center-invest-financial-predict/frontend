export type OgType = "website" | "article" | "product";

export type PageMetaInput = {
	title: string;
	description: string;
	canonicalUrl: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage: string;
	ogType?: OgType;
	siteName: string;
	locale: string;
	locales?: string[];
	noIndex?: boolean;
	jsonLd?: object | object[];
};

export type AlternateLink = {
	hreflang: string;
	href: string;
};

export type PageMetaTags = {
	title: string;
	description: string;
	canonicalUrl: string;
	robots?: string;
	og: {
		title: string;
		description: string;
		url: string;
		type: OgType;
		image: string;
		locale: string;
		siteName: string;
	};
	twitter: {
		card: "summary_large_image";
		title: string;
		description: string;
		image: string;
	};
	alternates: AlternateLink[];
	jsonLd?: object | object[];
};

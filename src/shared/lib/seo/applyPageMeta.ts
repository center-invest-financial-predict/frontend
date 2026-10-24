import { PageMetaTags } from "./types";

const ATTR = "data-app-meta";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
	let el = document.head.querySelector<HTMLMetaElement>(selector);
	if (!el) {
		el = document.createElement("meta");
		Object.entries(attrs).forEach(([k, v]) => {
			if (k !== "content") el!.setAttribute(k, v);
		});
		el.setAttribute(ATTR, "1");
		document.head.appendChild(el);
	}
	if (attrs.content !== undefined) el.setAttribute("content", attrs.content);
};

const upsertLink = (rel: string, href: string, extra?: Record<string, string>) => {
	const extraKey = extra
		? Object.entries(extra)
				.map(([k, v]) => `[${k}="${v}"]`)
				.join("")
		: "";
	const selector = `link[rel="${rel}"]${extraKey}`;
	let el = document.head.querySelector<HTMLLinkElement>(selector);
	if (!el) {
		el = document.createElement("link");
		el.setAttribute("rel", rel);
		if (extra) {
			Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
		}
		el.setAttribute(ATTR, "1");
		document.head.appendChild(el);
	}
	el.setAttribute("href", href);
};

const clearManaged = (keep: Set<Element>) => {
	document.head.querySelectorAll(`[${ATTR}="1"]`).forEach((node) => {
		if (!keep.has(node)) node.remove();
	});
};

export const applyPageMeta = (meta: PageMetaTags) => {
	const keep = new Set<Element>();

	document.title = meta.title;

	const desc = document.head.querySelector('meta[name="description"]');
	if (desc) {
		desc.setAttribute("content", meta.description);
		desc.setAttribute(ATTR, "1");
		keep.add(desc);
	} else {
		upsertMeta('meta[name="description"]', {
			name: "description",
			content: meta.description,
		});
		const created = document.head.querySelector('meta[name="description"]');
		if (created) keep.add(created);
	}

	upsertLink("canonical", meta.canonicalUrl);
	const canonical = document.head.querySelector('link[rel="canonical"]');
	if (canonical) keep.add(canonical);

	if (meta.robots) {
		upsertMeta('meta[name="robots"]', { name: "robots", content: meta.robots });
		const robots = document.head.querySelector('meta[name="robots"]');
		if (robots) keep.add(robots);
	}

	const ogPairs: [string, string][] = [
		["og:title", meta.og.title],
		["og:description", meta.og.description],
		["og:url", meta.og.url],
		["og:type", meta.og.type],
		["og:image", meta.og.image],
		["og:locale", meta.og.locale],
		["og:site_name", meta.og.siteName],
	];
	ogPairs.forEach(([property, content]) => {
		upsertMeta(`meta[property="${property}"]`, { property, content });
		const node = document.head.querySelector(`meta[property="${property}"]`);
		if (node) keep.add(node);
	});

	const twPairs: [string, string][] = [
		["twitter:card", meta.twitter.card],
		["twitter:title", meta.twitter.title],
		["twitter:description", meta.twitter.description],
		["twitter:image", meta.twitter.image],
	];
	twPairs.forEach(([name, content]) => {
		upsertMeta(`meta[name="${name}"]`, { name, content });
		const node = document.head.querySelector(`meta[name="${name}"]`);
		if (node) keep.add(node);
	});

	document.head
		.querySelectorAll(`link[rel="alternate"][hreflang][${ATTR}="1"]`)
		.forEach((n) => n.remove());
	meta.alternates.forEach(({ hreflang, href }) => {
		const el = document.createElement("link");
		el.setAttribute("rel", "alternate");
		el.setAttribute("hreflang", hreflang);
		el.setAttribute("href", href);
		el.setAttribute(ATTR, "1");
		document.head.appendChild(el);
		keep.add(el);
	});

	document.head
		.querySelectorAll(`script[type="application/ld+json"][${ATTR}="1"]`)
		.forEach((n) => n.remove());
	if (meta.jsonLd) {
		const payloads = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
		payloads.forEach((data) => {
			const el = document.createElement("script");
			el.type = "application/ld+json";
			el.setAttribute(ATTR, "1");
			el.text = JSON.stringify(data);
			document.head.appendChild(el);
			keep.add(el);
		});
	}

	clearManaged(keep);
};

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../../../../public/locales/en/translation.json";
import ru from "../../../../public/locales/ru/translation.json";
import enSeo from "../../../../public/locales/en/seo.json";
import ruSeo from "../../../../public/locales/ru/seo.json";

i18n.use(LanguageDetector).use(initReactI18next).init({
	resources: {
		en: { translation: en, seo: enSeo },
		ru: { translation: ru, seo: ruSeo },
	},
	fallbackLng: "en",
	lng: "ru",
	ns: ["translation", "seo"],
	defaultNS: "translation",
	debug: __IS_DEV__,
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;

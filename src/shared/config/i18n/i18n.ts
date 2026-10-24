import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../../../../public/locales/en/translation.json";
import ru from "../../../../public/locales/ru/translation.json";

i18n.use(LanguageDetector).use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ru: { translation: ru },
	},
	fallbackLng: "en",
	lng: "ru",
	debug: __IS_DEV__,
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;

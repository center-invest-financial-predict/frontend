import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ru from "../../../../public/locales/ru/translation.json";

i18n.use(LanguageDetector).use(initReactI18next).init({
	resources: {
		ru: { translation: ru },
	},
	fallbackLng: "ru",
	lng: "ru",
	debug: __IS_DEV__,
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;

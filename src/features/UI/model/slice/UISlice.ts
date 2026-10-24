import { PayloadAction } from "@reduxjs/toolkit";
import { UISchema, AppTheme } from "../types/UISchema";
import { buildSlice } from "@/shared/lib/store/buildSlice";
import { APP_THEME } from "@/shared/consts/localStorage";

const readStoredTheme = (): AppTheme => {
	if (typeof window === "undefined") return "light";
	const stored = window.localStorage.getItem(APP_THEME);
	return stored === "dark" ? "dark" : "light";
};

const persistTheme = (theme: AppTheme) => {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(APP_THEME, theme);
	document.documentElement.setAttribute("data-theme", theme);
};

const initialState: UISchema = {
	theme: readStoredTheme(),
	assistOpen: false,
	navOpen: false,
};

const UISlice = buildSlice({
	name: "ui",
	initialState,
	reducers: {
		toggleTheme: (state) => {
			state.theme = state.theme === "light" ? "dark" : "light";
			persistTheme(state.theme);
		},
		setTheme: (state, action: PayloadAction<AppTheme>) => {
			state.theme = action.payload;
			persistTheme(state.theme);
		},
		toggleAssist: (state) => {
			state.assistOpen = !state.assistOpen;
		},
		setAssistOpen: (state, action: PayloadAction<boolean>) => {
			state.assistOpen = action.payload;
		},
		setNavOpen: (state, action: PayloadAction<boolean>) => {
			state.navOpen = action.payload;
		},
		toggleNav: (state) => {
			state.navOpen = !state.navOpen;
		},
	},
});

export const { actions: UIActions, reducer: UIReducer, useActions: useUIActions } = UISlice;

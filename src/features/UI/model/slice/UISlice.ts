import { PayloadAction } from "@reduxjs/toolkit";
import { UISchema } from "../types/UISchema";
import { buildSlice } from "@/shared/lib/store/buildSlice";

const initialState: UISchema = {
	theme: "light",
	assistOpen: false,
};

const UISlice = buildSlice({
	name: "ui",
	initialState,
	reducers: {
		toggleTheme: (state) => {
			state.theme = state.theme === "light" ? "dark" : "light";
		},
		toggleAssist: (state) => {
			state.assistOpen = !state.assistOpen;
		},
		setAssistOpen: (state, action: PayloadAction<boolean>) => {
			state.assistOpen = action.payload;
		},
	},
});

export const { actions: UIActions, reducer: UIReducer, useActions: useUIActions } = UISlice;

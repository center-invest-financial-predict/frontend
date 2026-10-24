import { UISchema } from "../types/UISchema";
import { buildSlice } from "@/shared/lib/store/buildSlice";

const initialState: UISchema = {
	theme: "light",
};

const UISlice = buildSlice({
	name: "ui",
	initialState,
	reducers: {
		toggleTheme: (state) => {
			state.theme = state.theme === "light" ? "dark" : "light";
		},
	},
});

export const { actions: UIActions, reducer: UIReducer, useActions: useUIActions } = UISlice;

import { FC, ReactNode, useEffect } from "react";
import { useAppSelector } from "@/shared/lib/hooks/useAppSelector/useAppSelector";

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const theme = useAppSelector((state) => state.ui.theme);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
	}, [theme]);

	return <>{children}</>;
};

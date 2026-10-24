import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/shared/assets/fonts/fonts.scss";
import "@/app/styles/global.scss";
import "@/shared/config/i18n/i18n";
import App from "@/app/App";
import { ErrorBoundary } from "@/app/providers/ErrorBoundary";
import { StoreProvider } from "@/app/providers/StoreProvider";
import { ThemeProvider } from "@/app/styles/providers/ThemeProvider";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
	<BrowserRouter>
		<StoreProvider>
			<ErrorBoundary>
				<ThemeProvider>
					<App />
				</ThemeProvider>
			</ErrorBoundary>
		</StoreProvider>
	</BrowserRouter>,
);

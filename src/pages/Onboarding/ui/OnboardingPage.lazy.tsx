import { lazy } from "react";

export const LazyOnboardingPage = lazy(async () => await import("./OnboardingPage"));

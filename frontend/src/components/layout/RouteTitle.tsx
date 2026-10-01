import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

// Screen readers and browser tabs announce the page by its title, so keep it
// in step with the route. "/" keeps the marketing title from index.html.
const TITLES: Array<[path: string, title: string]> = [
    ["/login", "Sign in"],
    ["/register", "Create account"],
    ["/forgot-password", "Reset password"],
    ["/reset-password", "Choose a new password"],
    ["/verify-email", "Verify email"],
    ["/unsubscribe", "Email reminders"],
    ["/r/:slug", "Job search recap"],
    ["/dashboard", "Dashboard"],
    ["/applications/new", "New application"],
    ["/applications/:id", "Application"],
    ["/applications", "Applications"],
    ["/recap", "Recap"],
    ["/profile", "Profile"],
];

let defaultTitle: string | null = null;

export function RouteTitle() {
    const { pathname } = useLocation();

    useEffect(() => {
        defaultTitle ??= document.title;
        const hit = TITLES.find(([path]) => matchPath(path, pathname));
        document.title = hit ? `${hit[1]} | TRACKr` : pathname === "/" ? defaultTitle : "Page not found | TRACKr";
    }, [pathname]);

    return null;
}

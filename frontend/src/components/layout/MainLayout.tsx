import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, PlusCircle, Sparkles, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { cn } from "../../lib/utils";
import { useDialog } from "../../lib/useDialog";
import { Footer } from "./Footer";
import { EmailVerificationBanner } from "./EmailVerificationBanner";

export function MainLayout() {
    const { logout, user } = useAuth();
    const location = useLocation();
    // Labelled by default where there is room; first-timers should not have to decode icons.
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const drawerRef = useRef<HTMLDivElement>(null);
    useDialog(drawerRef, isMobileMenuOpen, () => setIsMobileMenuOpen(false));

    // The page scrolls inside this container, so a new route must reset it by hand.
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [location.pathname]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/applications", label: "Applications", icon: FileText },
        { href: "/applications/new", label: "New Application", icon: PlusCircle },
        { href: "/recap", label: "Recap", icon: Sparkles },
    ];

    // The most specific match wins, so /applications/new lights up "New Application" only.
    const activeHref = [...navItems]
        .sort((a, b) => b.href.length - a.href.length)
        .find((item) => location.pathname === item.href || location.pathname.startsWith(item.href + "/"))?.href;

    return (
        <div className="min-h-screen flex flex-col bg-neo-bg font-sans text-slate-900">
            {/* Top Navigation Bar (Mobile & Desktop) */}
            <header className="bg-white border-b-2 border-black h-16 flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {/* Mobile Hamburger */}
                    <button
                        type="button"
                        onClick={toggleMobileMenu}
                        aria-label="Open menu"
                        aria-expanded={isMobileMenuOpen}
                        className="md:hidden p-2 hover:bg-neo-primary hover:text-black border-2 border-transparent hover:border-black rounded-neo transition-all active:shadow-neo"
                    >
                        <Menu className="w-6 h-6" aria-hidden />
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        aria-expanded={isSidebarOpen}
                        className="hidden md:flex p-2 hover:bg-neo-primary hover:text-black border-2 border-transparent hover:border-black rounded-neo transition-all active:shadow-neo"
                    >
                        <Menu className="w-6 h-6" aria-hidden />
                    </button>

                    <div className="text-xl md:text-2xl font-black tracking-tighter text-black flex items-center gap-2">
                        <Link to="/dashboard">
                            TRACKr.
                        </Link>
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">BETA</span>
                        
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-700 hidden sm:inline-block max-w-[16rem] truncate">
                        {user?.email}
                    </span>
                    <div className="w-10 h-10 bg-neo-primary border-2 border-black rounded-full flex items-center justify-center text-black font-black shadow-neo-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar (Desktop) */}
                <aside
                    className={cn(
                        "hidden md:flex flex-col bg-white border-r-2 border-black transition-all duration-300 ease-in-out motion-reduce:transition-none z-40",
                        isSidebarOpen ? "w-64" : "w-24"
                    )}
                >
                    <nav className="flex-1 py-6 px-4 space-y-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href === activeHref;

                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    title={!isSidebarOpen ? item.label : ""}
                                    aria-label={!isSidebarOpen ? item.label : undefined}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 font-bold rounded-neo transition-all border-2",
                                        isActive
                                            ? "bg-neo-primary text-black border-black shadow-neo"
                                            : "text-slate-500 border-transparent hover:border-black hover:bg-slate-50 hover:text-black",
                                        !isSidebarOpen && "justify-center px-0"
                                    )}
                                >
                                    <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} aria-hidden />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t-2 border-black bg-slate-50">
                        <button
                            onClick={logout}
                            title={!isSidebarOpen ? "Logout" : ""}
                            aria-label={!isSidebarOpen ? "Logout" : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 w-full font-bold text-neo-red-deep hover:bg-neo-destructive hover:text-black hover:border-black border-2 border-transparent rounded-neo transition-all",
                                !isSidebarOpen && "justify-center"
                            )}
                        >
                            <LogOut className="w-6 h-6" aria-hidden />
                            {isSidebarOpen && <span>Logout</span>}
                        </button>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm" onClick={toggleMobileMenu}>
                        <div
                            ref={drawerRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Main menu"
                            tabIndex={-1}
                            className="bg-white w-64 h-full border-r-2 border-black shadow-neo-modal p-4 flex flex-col focus:outline-none"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
                                <h2 className="text-2xl font-black text-black">Menu</h2>
                                <button type="button" onClick={toggleMobileMenu} aria-label="Close menu" className="p-2 text-black hover:bg-neo-destructive hover:text-black border-2 border-transparent hover:border-black rounded-neo transition-all">
                                    <X className="w-6 h-6" aria-hidden />
                                </button>
                            </div>

                            <nav className="space-y-3 flex-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = item.href === activeHref;

                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            onClick={toggleMobileMenu}
                                            aria-current={isActive ? "page" : undefined}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 font-bold rounded-neo transition-all border-2",
                                                isActive
                                                    ? "bg-neo-primary text-black border-black shadow-neo"
                                                    : "text-slate-500 border-transparent hover:border-black hover:bg-slate-50"
                                            )}
                                        >
                                            <Icon className="w-6 h-6" aria-hidden />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <button
                                onClick={() => {
                                    logout();
                                    toggleMobileMenu();
                                }}
                                className="flex items-center gap-4 px-4 py-3 font-bold text-neo-red-deep border-2 border-transparent hover:border-black rounded-neo hover:bg-neo-destructive hover:text-black mt-auto"
                            >
                                <LogOut className="w-6 h-6" aria-hidden />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden relative">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
                        <div className="max-w-6xl mx-auto min-h-full flex flex-col">
                            <div className="flex-1">
                                {user && !user.emailVerified && <EmailVerificationBanner />}
                                <Outlet />
                            </div>
                            <Footer className="mt-8" />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

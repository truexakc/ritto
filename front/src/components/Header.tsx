import { useState, useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { useAppSelector } from "../store/hooks";
import { selectIsAuth, selectIsInitialized, selectCurrentUser } from "../store/slices/authSlice";
import { selectCartItems } from "../store/slices/cartSlice";
import LogoutButton from "./LogoutButton";
import { ShoppingCart, Menu, X, LogOut, LogIn } from "lucide-react";
import { getUserEmoji } from "../utils/emoji";
import { 
    colors, 
    spacing, 
    transitions, 
    blur, 
    borderRadius,
    avatarStyles,
    cn,
    conditional 
} from "../styles";

const Header = () => {
    const location = useLocation();
    const isHomePage = location.pathname === "/";
    const isAuth = useAppSelector(selectIsAuth);
    const isInitialized = useAppSelector(selectIsInitialized);
    const currentUser = useAppSelector(selectCurrentUser);
    const cartItems = useAppSelector(selectCartItems);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!isInitialized) return null;

    const toggleMenu = () => setMenuOpen(!menuOpen);

    const NavLinks = () => (
        <>
            <li>
                <RouterLink 
                    to="/" 
                    className="nav-link hover:text-[#e8262b] text-white transition-colors duration-200"
                    onClick={() => setMenuOpen(false)}
                >
                    Главная
                </RouterLink>
            </li>
            <li>
                <RouterLink 
                    to="/catalog" 
                    className="nav-link hover:text-[#e8262b] text-white transition-colors duration-200"
                    onClick={() => setMenuOpen(false)}
                >
                    Каталог
                </RouterLink>
            </li>
            {isHomePage && (
                <>
                    <li>
                        <ScrollLink 
                            to="delivery" 
                            smooth 
                            offset={-80}
                            className="nav-link cursor-pointer text-white hover:text-[#e8262b] transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            Доставка
                        </ScrollLink>
                    </li>
                    <li>
                        <ScrollLink 
                            to="discounts" 
                            smooth 
                            offset={-80}
                            className="nav-link cursor-pointer text-white hover:text-[#e8262b] transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            Акции
                        </ScrollLink>
                    </li>
                    <li>
                        <ScrollLink 
                            to="about" 
                            smooth 
                            offset={-80} 
                            className="nav-link cursor-pointer text-white hover:text-[#e8262b] transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            О нас
                        </ScrollLink>
                    </li>
                    <li>
                        <ScrollLink 
                            to="contact" 
                            smooth 
                            offset={-80}
                            className="nav-link cursor-pointer text-white hover:text-[#e8262b] transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            Контакты
                        </ScrollLink>
                    </li>
                </>
            )}
        </>
    );

    return (
        <>
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50",
            transitions.normal,
            conditional(
                isScrolled,
                `bg-[${colors.background.primary}]/95 ${blur.md} shadow-lg border-b border-white/10`,
                "bg-transparent"
            )
        )}>
            <div className={cn("w-full", spacing.container['2xl'], "mx-auto", spacing.padding.page, "h-20 flex justify-between items-center")}>
                {/* Logo */}
                <RouterLink 
                    to="/" 
                    className="flex items-center z-50"
                    onClick={() => setMenuOpen(false)}
                >
                    <img 
                        src="/logo2.svg" 
                        alt="logo" 
                        className="h-12 transition-transform duration-300 hover:scale-105"
                    />
                </RouterLink>

                <div className="flex items-center gap-6">
                    {/* Desktop Nav */}
                    <nav className="hidden lg:block">
                        <ul className="flex gap-8 xl:gap-10 items-center font-medium text-[16px] tracking-tight">
                            <NavLinks/>
                        </ul>
                    </nav>

                    {/* Desktop Icons */}
                    <div className="hidden lg:flex gap-6 items-center">
                        {/* Корзина */}
                        <RouterLink 
                            to="/basket" 
                            className="relative group p-2 rounded-lg hover:bg-white/5 transition-all duration-200"
                            title="Корзина"
                        >
                            <ShoppingCart className="w-6 h-6 text-[#e8262b] group-hover:scale-110 transition-transform"/>
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#e8262b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
                                    {totalItems}
                                </span>
                            )}
                        </RouterLink>

                        {/* Аккаунт */}
                        {isAuth && currentUser ? (
                            <div className="flex items-center gap-2">
                                <RouterLink 
                                    to="/profile" 
                                    className={cn(avatarStyles.small, "hover:scale-110", transitions.transform)}
                                    title="Профиль"
                                >
                                    {getUserEmoji(currentUser.id)}
                                </RouterLink>
                                <LogoutButton 
                                    icon={
                                        <div className={cn("p-2", borderRadius.md, "hover:bg-white/5", transitions.fast, "group")}>
                                            <LogOut className={cn("w-6 h-6", `text-[${colors.primary.main}]`, "group-hover:scale-110", transitions.transform)}/>
                                        </div>
                                    }
                                    onLogout={() => {}}
                                />
                            </div>
                        ) : !isAuth ? (
                            <RouterLink 
                                to="/login" 
                                className={cn("p-2", borderRadius.md, "hover:bg-white/5", transitions.fast, "group")}
                                title="Войти"
                            >
                                <LogIn className={cn("w-6 h-6", `text-[${colors.primary.main}]`, "group-hover:scale-110", transitions.transform)}/>
                            </RouterLink>
                        ) : null}
                    </div>

                    {/* Mobile icons */}
                    <div className="flex lg:hidden gap-3 items-center">
                        {/* Корзина */}
                        <RouterLink 
                            to="/basket" 
                            className="relative p-2 rounded-lg hover:bg-white/5 transition-all duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            <ShoppingCart className="w-6 h-6 text-[#e8262b]"/>
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#e8262b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {totalItems}
                                </span>
                            )}
                        </RouterLink>

                        {/* Бургер меню */}
                        <button 
                            onClick={toggleMenu} 
                            className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 text-[#e8262b]"
                        >
                            {menuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>
            </div>
        </header>

        {/* Mobile Menu - полностью вынесено за пределы header, всегда черный фон */}
        <div className={`
            fixed inset-0 top-20 bg-[#0a0a0a] backdrop-blur-md z-[60]
            transform transition-transform duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "translate-x-full"}
            lg:hidden
        `}>
            <div className="container mx-auto px-4 py-8 h-full flex flex-col">
                {/* Профиль пользователя в мобильном меню */}
                {isAuth && currentUser ? (
                    <div className="mb-8 pb-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#e8262b] to-[#d12025] rounded-full flex items-center justify-center text-3xl shadow-lg">
                                {getUserEmoji(currentUser.id)}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-semibold text-lg">{currentUser.name || 'Пользователь'}</p>
                                <p className="text-[#ADADAD] text-sm">{currentUser.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <RouterLink 
                                to="/profile" 
                                className="flex-1 bg-[#e8262b] hover:bg-[#d12025] text-white font-medium rounded-xl px-4 py-2 text-center transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                Профиль
                            </RouterLink>
                            <LogoutButton 
                                icon={
                                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl px-4 py-2 border border-white/10 transition-colors flex items-center justify-center gap-2">
                                        <LogOut className="w-4 h-4"/>
                                        Выйти
                                    </button>
                                }
                                onLogout={() => setMenuOpen(false)}
                            />
                        </div>
                    </div>
                ) : !isAuth ? (
                    <div className="mb-8 pb-6 border-b border-white/10">
                        <RouterLink 
                            to="/login" 
                            className="w-full bg-[#e8262b] hover:bg-[#d12025] text-white font-medium rounded-xl px-4 py-3 text-center transition-colors flex items-center justify-center gap-2"
                            onClick={() => setMenuOpen(false)}
                        >
                            <LogIn className="w-5 h-5"/>
                            Войти
                        </RouterLink>
                    </div>
                ) : null}

                <nav className="flex-1">
                    <ul className="flex flex-col gap-6 text-xl font-medium text-white">
                        <NavLinks/>
                    </ul>
                </nav>
                
                {/* Дополнительная информация в мобильном меню */}
                <div className="mt-auto pt-8 border-t border-white/10">
                    <div className="text-[#ADADAD] space-y-2">
                        <p className="font-semibold text-[#e8262b]">+7 (900) 00-00-00</p>
                        <p className="text-sm">ул. Ногорная д. 7</p>
                        <p className="text-sm">Ежедневно: 10:00 - 23:00</p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default Header;
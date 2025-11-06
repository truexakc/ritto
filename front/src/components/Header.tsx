import { useState, useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { useAppSelector } from "../store/hooks";
import { selectIsAuth, selectIsInitialized } from "../store/slices/authSlice";
import { selectCartItems } from "../store/slices/cartSlice";
import LogoutButton from "./LogoutButton";
import { ShoppingCart, Menu, X, LogOut, LogIn, User } from "lucide-react";

const Header = () => {
    const location = useLocation();
    const isHomePage = location.pathname === "/";
    const isAuth = useAppSelector(selectIsAuth);
    const isInitialized = useAppSelector(selectIsInitialized);
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
        <header className={`
            fixed top-0 left-0 right-0 z-50 transition-all duration-300
            ${isScrolled 
                ? "bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg border-b border-white/10" 
                : "bg-transparent"
            }
        `}>
            <div className="max-w-screen-xl mx-auto px-4 lg:px-8 h-20 flex justify-between items-center">
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
                        {isAuth ? (
                            <div className="flex items-center gap-2">
                                <RouterLink 
                                    to="/profile" 
                                    className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                                    title="Профиль"
                                >
                                    <User className="w-6 h-6 text-[#e8262b] group-hover:scale-110 transition-transform"/>
                                </RouterLink>
                                <LogoutButton 
                                    icon={
                                        <div className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group">
                                            <LogOut className="w-6 h-6 text-[#e8262b] group-hover:scale-110 transition-transform"/>
                                        </div>
                                    }
                                    onLogout={() => {}}
                                />
                            </div>
                        ) : (
                            <RouterLink 
                                to="/login" 
                                className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                                title="Войти"
                            >
                                <LogIn className="w-6 h-6 text-[#e8262b] group-hover:scale-110 transition-transform"/>
                            </RouterLink>
                        )}
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

                        {/* Аккаунт */}
                        {isAuth ? (
                            <>
                                <RouterLink 
                                    to="/profile" 
                                    className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <User className="w-6 h-6 text-[#e8262b]"/>
                                </RouterLink>
                                <LogoutButton 
                                    icon={
                                        <div className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200">
                                            <LogOut className="w-6 h-6 text-[#e8262b]"/>
                                        </div>
                                    }
                                    onLogout={() => setMenuOpen(false)}
                                />
                            </>
                        ) : (
                            <RouterLink 
                                to="/login" 
                                className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200"
                                onClick={() => setMenuOpen(false)}
                            >
                                <LogIn className="w-6 h-6 text-[#e8262b]"/>
                            </RouterLink>
                        )}

                        {/* Бургер меню */}
                        <button 
                            onClick={toggleMenu} 
                            className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 text-[#e8262b]"
                        >
                            {menuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`
                    fixed inset-0 top-20 bg-[#0a0a0a]/95 backdrop-blur-md z-40
                    transform transition-transform duration-300 ease-in-out
                    ${menuOpen ? "translate-x-0" : "translate-x-full"}
                    lg:hidden
                `}>
                    <div className="container mx-auto px-4 py-8">
                        <nav>
                            <ul className="flex flex-col gap-6 text-xl font-medium text-white">
                                <NavLinks/>
                            </ul>
                        </nav>
                        
                        {/* Дополнительная информация в мобильном меню */}
                        <div className="mt-12 pt-8 border-t border-white/10">
                            <div className="text-[#ADADAD] space-y-2">
                                <p className="font-semibold text-[#e8262b]">+7 (900) 00-00-00</p>
                                <p className="text-sm">ул. Ногорная д. 7</p>
                                <p className="text-sm">Ежедневно: 10:00 - 23:00</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
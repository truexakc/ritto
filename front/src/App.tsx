import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop.tsx";
import Loader from "./components/Loader";
import CookieConsent from "./components/CookieConsent";
import { useAuthInit } from "./hooks/useAuthInit";
import { useAppSelector } from "./store/hooks";
import { selectIsInitialized } from "./store/slices/authSlice";
import {Toaster} from "react-hot-toast";
import { useEffect } from "react";
import { initScrollReveal } from "./utils/scrollReveal";

const App = () => {
    useAuthInit();
    const isInitialized = useAppSelector(selectIsInitialized);
    useEffect(() => { initScrollReveal(); }, []);

    if (!isInitialized) {
        return <Loader />;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Toaster position="top-right" toastOptions={{
                duration: 4000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }}
            />
            <Header />
            <ScrollToTop />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <CookieConsent />
        </div>
    );
};

export default App;

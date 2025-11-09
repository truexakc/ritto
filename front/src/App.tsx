import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop.tsx";
import Loader from "./components/Loader";
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
        <>
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
            <Outlet />
            <Footer />
        </>
    );
};

export default App;

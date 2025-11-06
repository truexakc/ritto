import About from "../components/About";
import Contact from "../components/Contact";
import Delivery from "../components/Delivery";
import Popular from "../components/Popular";
import Wealcome from "../components/Wealcome";

const Home = () => {
    return (
        <>
            <section id="welcome">
                <Wealcome />
            </section>
            <section id="popular" data-reveal>
                <Popular />
            </section>
            <section id="delivery" data-reveal>
                <Delivery />
            </section>
            <section id="about" data-reveal>
                <About />
            </section>
            <section id="contact" data-reveal>
                <Contact />
            </section>
        </>
    );
};

export default Home;

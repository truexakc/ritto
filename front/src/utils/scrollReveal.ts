let initialized = false;

export function initScrollReveal() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    // Stop observing once revealed
                    observer.unobserve(entry.target);
                }
            });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    const observeAll = () => {
        // Auto-apply to elements with data-reveal or .reveal
        const candidates = document.querySelectorAll('[data-reveal], .reveal');
        candidates.forEach((el) => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
            }
            observer.observe(el);
        });
    };

    // Initial scan
    observeAll();

    // Observe future mutations (route changes, dynamic content)
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });
}





/* Modern Library - final interaction fixes */
(function () {
    "use strict";

    const menuButton = document.getElementById("menu-btn");
    const menuPanel = document.getElementById("menu-panel");
    const mobileLinks = document.querySelectorAll(".mobile-nav-link");
    const desktopLinks = document.querySelectorAll(".main-nav .nav-link");
    const readingSection = document.getElementById("currently-reading-section");
    const librarySection = document.getElementById("library-section");
    const statsSection = document.getElementById("stats-section");

    const sections = {
        reading: readingSection,
        library: librarySection,
        journal: statsSection
    };

    function closeMenu() {
        if (!menuPanel) return;
        menuPanel.classList.remove("open");
        menuPanel.setAttribute("aria-hidden", "true");
        if (menuButton) menuButton.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
        if (!menuPanel) return;
        menuPanel.classList.add("open");
        menuPanel.setAttribute("aria-hidden", "false");
        if (menuButton) menuButton.setAttribute("aria-expanded", "true");
    }

    if (menuButton) {
        menuButton.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = menuPanel && menuPanel.classList.contains("open");
            isOpen ? closeMenu() : openMenu();
        });
    }

    function setActiveNav(name) {
        document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(link => {
            const href = link.getAttribute("href") || "";
            const active =
                (name === "reading" && href === "#currently-reading-section") ||
                (name === "library" && href === "#library-section") ||
                (name === "journal" && href === "#stats-section");
            link.classList.toggle("active", active);
        });
    }

    function showView(name) {
        Object.entries(sections).forEach(([key, section]) => {
            if (!section) return;
            section.classList.toggle("view-active", key === name);
        });

        setActiveNav(name);
        closeMenu();

        if (name === "library" && typeof renderLibrary === "function") renderLibrary();
        if (name === "reading" && typeof renderCurrentlyReading === "function") renderCurrentlyReading();
        if (name === "journal" && typeof updateStatsAndChart === "function") updateStatsAndChart();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleNavigation(event, name) {
        event.preventDefault();
        showView(name);
    }

    desktopLinks.forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");
            const name = href === "#library-section" ? "library" : href === "#stats-section" ? "journal" : "reading";
            handleNavigation(event, name);
        });
    });

    mobileLinks.forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");
            const name = href === "#library-section" ? "library" : href === "#stats-section" ? "journal" : "reading";
            handleNavigation(event, name);
        });
    });

    document.addEventListener("click", event => {
        if (menuPanel && menuButton && menuPanel.classList.contains("open") && !menuPanel.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });

    /* Attach the existing page tracker whenever a reading book is opened. */
    const originalOpenBookDetails = typeof window.openBookDetails === "function" ? window.openBookDetails : null;

    if (originalOpenBookDetails) {
        window.openBookDetails = function (id) {
            originalOpenBookDetails(id);

            const book = Array.isArray(window.myLibrary) ? window.myLibrary.find(item => item.id === id) : null;

            if (book && book.status === "reading" && typeof window.addPageTrackerToDetails === "function") {
                window.addPageTrackerToDetails(book);
            }
        };
    }

    /* Always start in Currently Reading after a fresh load. */
    function initializeFinalNavigation() {
        showView("reading");
        if (typeof window.renderAll === "function") window.renderAll();
        if (typeof window.updateStatsAndChart === "function") window.updateStatsAndChart();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeFinalNavigation, { once: true });
    } else {
        initializeFinalNavigation();
    }
})();

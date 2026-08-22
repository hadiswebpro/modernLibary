/* Modern Library — navigation + shared story viewer fixes */
(function () {
    "use strict";

    const menuButton = document.getElementById("menu-btn");
    const menuPanel = document.getElementById("menu-panel");
    const mobileLinks = document.querySelectorAll(".mobile-nav-link");
    const desktopLinks = document.querySelectorAll(".main-nav .nav-link");
    const readingSection = document.getElementById("currently-reading-section");
    const librarySection = document.getElementById("library-section");
    const statsSection = document.getElementById("stats-section");
    const bookDetails = document.getElementById("book-details");

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
        menuButton.addEventListener("click", event => {
            event.stopPropagation();
            menuPanel.classList.contains("open") ? closeMenu() : openMenu();
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

    function alignStoryViewer() {
        if (!bookDetails || window.innerWidth <= 850) return;
        const activeSection = readingSection && readingSection.classList.contains("view-active")
            ? readingSection
            : librarySection && librarySection.classList.contains("view-active")
                ? librarySection
                : null;
        if (!activeSection) return;
        const main = document.querySelector("main");
        if (!main) return;
        const top = activeSection.offsetTop;
        bookDetails.style.top = `${top}px`;
    }

    function showView(name) {
        Object.entries(sections).forEach(([key, section]) => {
            if (section) section.classList.toggle("view-active", key === name);
        });

        setActiveNav(name);
        closeMenu();

        if (bookDetails) {
            const showViewer = name === "reading" || name === "library";
            bookDetails.classList.toggle("viewer-hidden", !showViewer);
            bookDetails.setAttribute("aria-hidden", String(!showViewer));
        }

        if (name === "library" && typeof window.renderLibrary === "function") window.renderLibrary();
        if (name === "reading" && typeof window.renderCurrentlyReading === "function") window.renderCurrentlyReading();
        if (name === "journal" && typeof window.updateStatsAndChart === "function") window.updateStatsAndChart();

        requestAnimationFrame(alignStoryViewer);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function nameFromLink(link) {
        const href = link.getAttribute("href");
        if (href === "#library-section") return "library";
        if (href === "#stats-section") return "journal";
        return "reading";
    }

    [...desktopLinks, ...mobileLinks].forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            showView(nameFromLink(link));
        });
    });

    document.addEventListener("click", event => {
        if (menuPanel && menuButton && menuPanel.classList.contains("open") && !menuPanel.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });

    /* ---------------------------------------------------------
       STORY VIEWER CONTROLS
       The original details card stays intact. We only enhance it
       with a close button and the page input for reading books.
    --------------------------------------------------------- */

    function enhanceStoryViewer() {
        if (!bookDetails || bookDetails.classList.contains("empty")) return;
        const detailsBook = bookDetails.querySelector(".details-book");
        if (!detailsBook) return;

        if (!detailsBook.querySelector(".details-close")) {
            const close = document.createElement("button");
            close.type = "button";
            close.className = "details-close";
            close.id = "close-details";
            close.setAttribute("aria-label", "Close story");
            close.title = "Close story";
            close.textContent = "×";
            close.addEventListener("click", event => {
                event.stopPropagation();
                if (typeof window.closeBookDetails === "function") {
                    window.closeBookDetails();
                } else {
                    bookDetails.classList.remove("open");
                }
            });
            detailsBook.appendChild(close);
        }

        const bookId = document.querySelector(`.book-card[data-id]`) ? null : null;
        const cards = document.querySelectorAll(".book-card");
        let selectedBook = null;
        for (const card of cards) {
            if (card.classList.contains("book-card--reading") && bookDetails.querySelector(".details-progress")) {
                const id = card.dataset.id;
                try {
                    const books = JSON.parse(localStorage.getItem("books")) || [];
                    selectedBook = books.find(book => book.id === id) || null;
                } catch (_) {}
                if (selectedBook) break;
            }
        }

        /* The selected book is inferred from the visible Current page line. */
        let readingBook = null;
        try {
            const books = JSON.parse(localStorage.getItem("books")) || [];
            const currentLine = [...detailsBook.querySelectorAll(".details-info p")]
                .find(p => p.textContent.toLowerCase().includes("current page"));
            if (currentLine) {
                const match = currentLine.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    readingBook = books.find(book =>
                        book.status === "reading" &&
                        Number(book.currentPage) === Number(match[1]) &&
                        Number(book.pages) === Number(match[2])
                    ) || null;
                }
            }
        } catch (_) {}

        if (readingBook && !detailsBook.querySelector(".details-page-control")) {
            const control = document.createElement("div");
            control.className = "details-page-control";

            const label = document.createElement("label");
            label.textContent = "Page";

            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.max = String(readingBook.pages);
            input.value = String(readingBook.currentPage);
            input.setAttribute("aria-label", "Current page");

            const save = document.createElement("button");
            save.type = "button";
            save.textContent = "Save";
            save.addEventListener("click", event => {
                event.stopPropagation();
                if (typeof window.updateCurrentPage === "function") {
                    window.updateCurrentPage(readingBook.id, input.value);
                }
            });

            control.append(label, input, save);

            const progress = detailsBook.querySelector(".details-progress");
            if (progress) progress.insertAdjacentElement("afterend", control);
            else detailsBook.querySelector(".details-info")?.appendChild(control);
        }
    }

    if (bookDetails) {
        const observer = new MutationObserver(() => {
            if (!bookDetails.classList.contains("empty")) {
                requestAnimationFrame(enhanceStoryViewer);
            }
        });
        observer.observe(bookDetails, { childList: true, subtree: true });
    }

    /* Existing page tracker hook is retained if another script provides it. */
    const originalOpenBookDetails = window.openBookDetails;
    if (typeof originalOpenBookDetails === "function") {
        window.openBookDetails = function (id) {
            originalOpenBookDetails(id);
            requestAnimationFrame(enhanceStoryViewer);
            requestAnimationFrame(alignStoryViewer);
        };
    }

    window.addEventListener("resize", alignStoryViewer);

    function initializeFinalNavigation() {
        showView("reading");
        if (typeof window.renderAll === "function") window.renderAll();
        if (typeof window.updateStatsAndChart === "function") window.updateStatsAndChart();
        requestAnimationFrame(alignStoryViewer);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeFinalNavigation, { once: true });
    } else {
        initializeFinalNavigation();
    }
})();

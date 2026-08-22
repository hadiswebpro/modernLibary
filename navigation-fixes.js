/* Modern Library — navigation, search, shared story viewer */
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
    const bookContainer = document.getElementById("books-container");
    const readingContainer = document.getElementById("reading-container");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");

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
            menuPanel?.classList.contains("open") ? closeMenu() : openMenu();
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

        const activeSection = Object.values(sections).find(section =>
            section?.classList.contains("view-active")
        );

        if (!activeSection) return;

        const target = activeSection.querySelector(
            ".currently-reading, .library-content, .reading-stats"
        ) || activeSection;

        const mainRect = bookDetails.parentElement.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        bookDetails.style.top = `${Math.max(0, targetRect.top - mainRect.top)}px`;
    }

    function refreshCards() {
        addStatusLabels(bookContainer);
        addStatusLabels(readingContainer);
    }

    function showView(name) {
        Object.entries(sections).forEach(([key, section]) => {
            section?.classList.toggle("view-active", key === name);
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

        requestAnimationFrame(() => {
            refreshCards();
            alignStoryViewer();
        });

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
        if (
            menuPanel &&
            menuButton &&
            menuPanel.classList.contains("open") &&
            !menuPanel.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });

    function filterLibraryCards() {
        if (!bookContainer) return;

        const query = (searchInput?.value || "").trim().toLowerCase();
        const cards = bookContainer.querySelectorAll(".book-card");
        let visible = 0;

        cards.forEach(card => {
            const match = !query || card.textContent.toLowerCase().includes(query);
            card.style.display = match ? "" : "none";
            if (match) visible++;
        });

        const empty = document.getElementById("library-empty");
        if (empty) {
            empty.textContent = query && visible === 0
                ? "No stories match your search..."
                : "Your library is waiting for its first story...";
            empty.style.display = visible === 0 ? "block" : "none";
        }
    }

    function openLibraryForSearch() {
        showView("library");
        requestAnimationFrame(filterLibraryCards);
    }

    if (searchInput) {
        searchInput.addEventListener("input", openLibraryForSearch);
        searchInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                openLibraryForSearch();
            }
        });
    }

    searchBtn?.addEventListener("click", event => {
        event.preventDefault();
        openLibraryForSearch();
    });

    function addStatusLabels(container) {
        if (!container) return;

        container.querySelectorAll(".book-card").forEach(card => {
            if (card.querySelector(".book-status-label")) return;

            let status = "not-read";
            if (card.classList.contains("book-card--reading")) status = "reading";
            if (card.classList.contains("book-card--read")) status = "read";

            const label = document.createElement("span");
            label.className = `book-status-label book-status-label--${status}`;
            label.textContent = {
                reading: "Currently Reading",
                read: "Read",
                "not-read": "Not Read"
            }[status];
            card.appendChild(label);
        });
    }

    function restoreEmptyStory() {
        if (!bookDetails) return;

        bookDetails.classList.add("empty");
        bookDetails.removeAttribute("data-book-id");
        bookDetails.innerHTML = `
            <div class="details-empty-content">
                <span class="details-empty-icon">✦</span>
                <strong>Open a story</strong>
                <p>Select a book from Reading or Library to see its details.</p>
            </div>
        `;
    }

    window.closeBookDetails = restoreEmptyStory;

    function addCurrentPageControls() {
        if (!bookDetails || bookDetails.classList.contains("empty")) return;

        const detailsBook = bookDetails.querySelector(".details-book");
        if (!detailsBook || detailsBook.querySelector(".details-page-control")) return;

        const status = detailsBook.querySelector(".details-status")?.textContent?.trim();
        if (status !== "Currently Reading") return;

        const title = detailsBook.querySelector(".details-title")?.textContent?.trim();
        const authorText = detailsBook.querySelector(".details-author")?.textContent?.trim() || "";
        const author = authorText.replace(/^by\s+/i, "").trim();
        if (!title) return;

        const books = JSON.parse(localStorage.getItem("books") || "[]");
        const book = books.find(item => item.title === title && item.author === author);
        if (!book) return;

        const control = document.createElement("div");
        control.className = "details-page-control";

        const label = document.createElement("label");
        label.textContent = "Page";

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = String(book.pages);
        input.value = String(book.currentPage ?? 0);
        input.setAttribute("aria-label", "Current page");

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.textContent = "Save";

        saveButton.addEventListener("click", event => {
            event.stopPropagation();

            const value = Number(input.value);
            if (!Number.isFinite(value) || value < 0 || value > book.pages) {
                input.value = String(book.currentPage ?? 0);
                return;
            }

            const latestBooks = JSON.parse(localStorage.getItem("books") || "[]");
            const latestBook = latestBooks.find(item => item.id === book.id);
            if (!latestBook) return;

            latestBook.currentPage = Math.floor(value);
            localStorage.setItem("books", JSON.stringify(latestBooks));

            if (typeof window.renderAll === "function") window.renderAll();
            if (typeof window.openBookDetails === "function") {
                window.openBookDetails(latestBook.id);
            }
        });

        control.append(label, input, saveButton);

        const progress = detailsBook.querySelector(".details-progress");
        if (progress) {
            progress.insertAdjacentElement("afterend", control);
        } else {
            const actions = detailsBook.querySelector(".details-actions");
            if (actions) actions.insertAdjacentElement("beforebegin", control);
            else detailsBook.appendChild(control);
        }
    }

    function enhanceStoryViewer() {
        if (!bookDetails || bookDetails.classList.contains("empty")) return;

        const detailsBook = bookDetails.querySelector(".details-book");
        if (!detailsBook) return;

        if (!detailsBook.querySelector(".details-close")) {
            const close = document.createElement("button");
            close.type = "button";
            close.className = "details-close";
            close.setAttribute("aria-label", "Close story");
            close.title = "Close story";
            close.textContent = "×";
            close.addEventListener("click", event => {
                event.stopPropagation();
                restoreEmptyStory();
            });
            detailsBook.appendChild(close);
        }

        addCurrentPageControls();
    }

    if (bookDetails) {
        const observer = new MutationObserver(() => {
            if (!bookDetails.classList.contains("empty")) {
                requestAnimationFrame(enhanceStoryViewer);
            }
        });
        observer.observe(bookDetails, { childList: true, subtree: true });
    }

    const originalOpenBookDetails = window.openBookDetails;
    if (typeof originalOpenBookDetails === "function") {
        window.openBookDetails = function (id) {
            originalOpenBookDetails(id);
            requestAnimationFrame(() => {
                enhanceStoryViewer();
                alignStoryViewer();
            });
        };
    }

    window.addEventListener("resize", () => {
        const activeName = Object.keys(sections).find(
            key => sections[key]?.classList.contains("view-active")
        );
        bookDetails?.classList.toggle("viewer-hidden", activeName === "journal");
        alignStoryViewer();
    });

    function initializeFinalNavigation() {
        showView("reading");
        if (typeof window.renderAll === "function") window.renderAll();
        if (typeof window.updateStatsAndChart === "function") window.updateStatsAndChart();
        requestAnimationFrame(() => {
            refreshCards();
            alignStoryViewer();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeFinalNavigation, { once: true });
    } else {
        initializeFinalNavigation();
    }
})();

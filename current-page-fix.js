/* Current page / progress fix.
   Save updates only the selected story and its visible cards.
   It never reloads or re-renders the whole page. */
(function () {
    "use strict";
    const viewer = document.getElementById("book-details");
    if (!viewer) return;

    function readBooks() {
        try { return JSON.parse(localStorage.getItem("books") || "[]"); }
        catch { return []; }
    }

    function getOpenBook() {
        const books = readBooks();
        const details = viewer.querySelector(".details-book");
        if (!details) return null;
        const id = viewer.dataset.bookId || details.dataset.bookId;
        if (id) return books.find(book => String(book.id) === String(id)) || null;
        const title = details.querySelector(".details-title")?.textContent?.trim();
        const author = (details.querySelector(".details-author")?.textContent || "").replace(/^by\s+/i, "").trim();
        return books.find(book => book.title === title && book.author === author) || null;
    }

    function updateVisibleUI(book, details, input) {
        const total = Number(book.pages) || 0;
        const page = Number(book.currentPage) || 0;
        const percent = total > 0 ? Math.min(100, Math.max(0, (page / total) * 100)) : 0;
        if (input) input.value = String(page);
        const currentPage = [...details.querySelectorAll(".details-info p")]
            .find(el => el.querySelector("strong")?.textContent?.trim().toLowerCase() === "current page")?.querySelector("span");
        if (currentPage) currentPage.textContent = `${page} / ${total}`;
        const progressBar = details.querySelector(".details-progress-bar");
        if (progressBar) progressBar.style.width = `${percent}%`;
        const progressText = details.querySelector(".details-progress-text");
        if (progressText) progressText.textContent = `${Math.round(percent)}% read`;
        document.querySelectorAll(`#reading-container [data-id="${CSS.escape(String(book.id))}"], #books-container [data-id="${CSS.escape(String(book.id))}"]`).forEach(card => {
            const pageEl = card.querySelector(".reading-page");
            if (pageEl) pageEl.textContent = `${page} / ${total}`;
        });
    }

    function saveCurrentPage() {
        const details = viewer.querySelector(".details-book");
        const input = details?.querySelector(".details-page-control input");
        const book = getOpenBook();
        if (!details || !input || !book) return;
        const total = Number(book.pages) || 0;
        const value = Math.floor(Number(input.value));
        if (!Number.isFinite(value) || value < 0 || value > total) {
            input.value = String(Number(book.currentPage) || 0);
            return;
        }
        const books = readBooks();
        const storedBook = books.find(item => String(item.id) === String(book.id));
        if (!storedBook) return;
        storedBook.currentPage = value;
        localStorage.setItem("books", JSON.stringify(books));
        updateVisibleUI(storedBook, details, input);
    }

    function enhanceButton(button) {
        if (button.dataset.pageFixApplied === "true") return;
        button.dataset.pageFixApplied = "true";
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            saveCurrentPage();
        }, true);
    }

    function fixControls() {
        viewer.querySelectorAll(".details-page-control .save-page-btn").forEach(enhanceButton);
    }

    const observer = new MutationObserver(fixControls);
    observer.observe(viewer, { childList: true, subtree: true });
    fixControls();
})();

/* Current page / progress fix.
   Replaces the injected Save control so the saved value immediately updates
   the stored book, current-page text and progress bar without changing layout. */
(function () {
    "use strict";

    const viewer = document.getElementById("book-details");
    if (!viewer) return;

    function getBookFromViewer() {
        let books;
        try {
            books = JSON.parse(localStorage.getItem("books") || "[]");
        } catch {
            return null;
        }

        const details = viewer.querySelector(".details-book");
        if (!details) return null;

        const id = viewer.dataset.bookId || details.dataset.bookId;
        if (id) {
            const byId = books.find(book => String(book.id) === String(id));
            if (byId) return byId;
        }

        const title = details.querySelector(".details-title")?.textContent?.trim();
        const authorText = details.querySelector(".details-author")?.textContent?.trim() || "";
        const author = authorText.replace(/^by\s+/i, "").trim();
        return books.find(book => book.title === title && book.author === author) || null;
    }

    function replaceSaveButton(button) {
        if (!button || button.dataset.pageFixApplied === "true") return;

        const replacement = button.cloneNode(true);
        replacement.dataset.pageFixApplied = "true";
        button.replaceWith(replacement);

        replacement.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const details = viewer.querySelector(".details-book");
            const input = details?.querySelector(".details-page-control input");
            const book = getBookFromViewer();
            if (!input || !book) return;

            const value = Math.floor(Number(input.value));
            const total = Number(book.pages);

            if (!Number.isFinite(value) || value < 0 || value > total) {
                input.value = String(Number(book.currentPage) || 0);
                return;
            }

            let books;
            try {
                books = JSON.parse(localStorage.getItem("books") || "[]");
            } catch {
                return;
            }

            const storedBook = books.find(item => String(item.id) === String(book.id));
            if (!storedBook) return;

            storedBook.currentPage = value;
            localStorage.setItem("books", JSON.stringify(books));

            input.value = String(value);

            const currentPage = details.querySelector(".current-page");
            if (currentPage) currentPage.textContent = `${value} / ${total}`;

            const progressBar = details.querySelector(".details-progress-bar");
            const percent = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
            if (progressBar) progressBar.style.width = `${percent}%`;

            const progressText = details.querySelector(".details-progress-text");
            if (progressText) progressText.textContent = `${Math.round(percent)}% read`;

            const readingPage = document.querySelector(
                `#reading-container [data-id="${CSS.escape(String(storedBook.id))}"] .reading-page`
            );
            if (readingPage) readingPage.textContent = `${value} / ${total}`;

            const libraryPage = document.querySelector(
                `#books-container [data-id="${CSS.escape(String(storedBook.id))}"] .reading-page`
            );
            if (libraryPage) libraryPage.textContent = `${value} / ${total}`;
        });
    }

    function fixControls() {
        viewer.querySelectorAll(".details-page-control .save-page-btn").forEach(replaceSaveButton);
    }

    const observer = new MutationObserver(fixControls);
    observer.observe(viewer, { childList: true, subtree: true });
    fixControls();
})();

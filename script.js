/* =========================================================
   DOM
========================================================= */

const bookContainer = document.getElementById("books-container");

const readingContainer = document.getElementById("reading-container");

const modal = document.getElementById("bookDialog");

const bookForm = document.getElementById("bookForm");

const openModalBtn = document.getElementById("add-btn");

const closeModalBtn = document.getElementById("cancelBtn");

const submitBtn = document.getElementById("submitBtn");

const statusSelect = document.getElementById("book-status");

const searchInput = document.getElementById("search-input");

const searchBtn = document.getElementById("search-btn");

const libraryEmpty = document.getElementById("library-empty");

const readingEmpty = document.getElementById("reading-empty");

const bookDetails = document.getElementById("book-details");

const deleteDialog = document.getElementById("deleteDialog");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const alertContainer = document.getElementById("alert-container");

const totalBooksElement = document.getElementById("total-books");

const booksReadElement = document.getElementById("books-read");

const booksReadingElement = document.getElementById("books-reading");

const chartCanvas = document.getElementById("reading-chart");

/* =========================================================
   STATE
========================================================= */

let editBookId = null;

let deleteBookId = null;

let currentLibraryFilter = "all";

let currentChartPeriod = "all";

/* =========================================================
   LOAD LIBRARY
========================================================= */

let myLibrary = JSON.parse(localStorage.getItem("books")) || [];

/* =========================================================
   RESTORE DATES
========================================================= */

myLibrary.forEach((book) => {
  if (book.startedAt) {
    book.startedAt = new Date(book.startedAt);
  }

  if (book.finishedAt) {
    book.finishedAt = new Date(book.finishedAt);
  }
});

/* =========================================================
   SAVE LIBRARY
========================================================= */

function saveLibrary() {
  localStorage.setItem("books", JSON.stringify(myLibrary));
}

/* =========================================================
   BOOK CONSTRUCTOR
========================================================= */

function Book(title, author, pages, status) {
  this.id = crypto.randomUUID();

  this.title = title;

  this.author = author;

  this.pages = pages;

  this.status = status;

  this.startedAt = null;

  this.finishedAt = null;

  this.currentPage = 0;

  if (status === "reading") {
    this.startedAt = new Date();
  }

  if (status === "read") {
    this.currentPage = pages;

    this.startedAt = new Date();

    this.finishedAt = new Date();
  }
}

/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddBookModal() {
  editBookId = null;

  bookForm.reset();

  submitBtn.textContent = "Add Book";

  updateStatusColor();

  modal.showModal();
}

/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditBookModal(book) {
  editBookId = book.id;

  bookForm.elements.title.value = book.title;

  bookForm.elements.author.value = book.author;

  bookForm.elements.pages.value = book.pages;

  bookForm.elements.status.value = book.status;

  submitBtn.textContent = "Save Changes";

  updateStatusColor();

  modal.showModal();
}

/* =========================================================
   CLOSE MODAL
========================================================= */

function closeBookModal() {
  editBookId = null;

  bookForm.reset();

  submitBtn.textContent = "Add Book";

  updateStatusColor();

  modal.close();
}

/* =========================================================
   STATUS COLOR
========================================================= */

function updateStatusColor() {
  statusSelect.classList.remove(
    "status-not-read",
    "status-reading",
    "status-read",
  );

  if (statusSelect.value === "not-read") {
    statusSelect.classList.add("status-not-read");
  }

  if (statusSelect.value === "reading") {
    statusSelect.classList.add("status-reading");
  }

  if (statusSelect.value === "read") {
    statusSelect.classList.add("status-read");
  }
}

/* =========================================================
   ADD BOOK
========================================================= */

function addBook(title, author, pages, status) {
  const book = new Book(title, author, pages, status);

  myLibrary.push(book);

  saveLibrary();
}

/* =========================================================
   UPDATE BOOK
========================================================= */

function updateBook(book, title, author, pages, status) {
  const previousStatus = book.status;

  book.title = title;

  book.author = author;

  book.pages = pages;

  book.status = status;

  /* NOT READ */

  if (status === "not-read") {
    book.currentPage = 0;

    book.startedAt = null;

    book.finishedAt = null;
  }

  /* READING */

  if (status === "reading") {
    if (previousStatus !== "reading") {
      book.startedAt = new Date();
    }

    if (!book.startedAt) {
      book.startedAt = new Date();
    }

    book.finishedAt = null;

    if (book.currentPage > book.pages) {
      book.currentPage = book.pages;
    }
  }

  /* READ */

  if (status === "read") {
    book.currentPage = book.pages;

    if (!book.startedAt) {
      book.startedAt = new Date();
    }

    if (!book.finishedAt) {
      book.finishedAt = new Date();
    }
  }
}

/* =========================================================
   FORM SUBMIT
========================================================= */

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(bookForm);

  const title = formData.get("title").trim();

  const author = formData.get("author").trim();

  const pages = Number(formData.get("pages"));

  const status = formData.get("status");

  if (!title || !author || !pages || pages < 1) {
    showAlert("Please fill in all book information.");

    return;
  }

  if (editBookId) {
    const book = myLibrary.find((item) => item.id === editBookId);

    if (book) {
      updateBook(book, title, author, pages, status);
    }
  } else {
    addBook(title, author, pages, status);
  }

  saveLibrary();

  closeBookModal();

  renderAll();

  showAlert(editBookId ? "Book updated." : `"${title}" added to your library.`);
});

/* =========================================================
   MODAL EVENTS
========================================================= */

openModalBtn.addEventListener("click", openAddBookModal);

closeModalBtn.addEventListener("click", closeBookModal);

statusSelect.addEventListener("change", updateStatusColor);

/* =========================================================
   CLOSE MODAL WITH ESC
========================================================= */

modal.addEventListener("cancel", (event) => {
  event.preventDefault();

  closeBookModal();
});

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/* =========================================================
   STATUS TEXT
========================================================= */

const statusText = {
  "not-read": "Not Read",

  reading: "Currently Reading",

  read: "Read",
};

/* =========================================================
   CREATE BOOK CARD
========================================================= */

function createBookCard(book) {
  const card = document.createElement("article");

  card.classList.add("book-card", `book-card--${book.status}`);

  card.dataset.id = book.id;

  /* =====================================================
       BOOK CONTENT
    ===================================================== */

  const bookInfo = document.createElement("div");

  bookInfo.classList.add("book-info");

  const title = document.createElement("h3");

  title.classList.add("book-title");

  title.textContent = book.title;

  const author = document.createElement("p");

  author.classList.add("book-author");

  author.textContent = `by ${book.author}`;

  bookInfo.append(title, author);

  /* =====================================================
       READING PAGE
       Only shown for Currently Reading.
    ===================================================== */

  if (book.status === "reading") {
    const page = document.createElement("p");

    page.classList.add("reading-page");

    page.textContent = `${book.currentPage} / ${book.pages}`;

    bookInfo.append(page);
  }

  /* =====================================================
       CARD
    ===================================================== */

  card.append(bookInfo);

  /* =====================================================
       OPEN DETAILS
    ===================================================== */

  card.addEventListener("click", () => {
    openBookDetails(book.id);
  });

  return card;
}

/* =========================================================
   CREATE CURRENTLY READING CARD
========================================================= */

function createReadingCard(book) {
  const card = createBookCard(book);

  card.classList.add("reading-book-card");

  return card;
}

/* =========================================================
   GET LIBRARY BOOKS
========================================================= */

function getFilteredBooks() {
  if (currentLibraryFilter === "all") {
    return [...myLibrary];
  }

  return myLibrary.filter((book) => book.status === currentLibraryFilter);
}

/* =========================================================
   RENDER LIBRARY
========================================================= */

function renderLibrary() {
  if (!bookContainer) {
    return;
  }

  bookContainer.innerHTML = "";

  const books = getFilteredBooks();

  /* =====================================================
       EMPTY LIBRARY
    ===================================================== */

  if (books.length === 0) {
    if (libraryEmpty) {
      libraryEmpty.style.display = "block";
    }

    return;
  }

  if (libraryEmpty) {
    libraryEmpty.style.display = "none";
  }

  /* =====================================================
       SORT BY DATE
       Newest activity first.
    ===================================================== */

  books.sort((a, b) => {
    const dateA = new Date(a.finishedAt || a.startedAt || 0);

    const dateB = new Date(b.finishedAt || b.startedAt || 0);

    return dateB - dateA;
  });

  /* =====================================================
       CREATE CARDS
    ===================================================== */

  books.forEach((book) => {
    const card = createBookCard(book);

    bookContainer.appendChild(card);
  });
}

/* =========================================================
   RENDER CURRENTLY READING
========================================================= */

function renderCurrentlyReading() {
  if (!readingContainer) {
    return;
  }

  readingContainer.innerHTML = "";

  const books = myLibrary.filter((book) => book.status === "reading");

  /* =====================================================
       EMPTY
    ===================================================== */

  if (books.length === 0) {
    if (readingEmpty) {
      readingEmpty.style.display = "block";
    }

    return;
  }

  if (readingEmpty) {
    readingEmpty.style.display = "none";
  }

  /* =====================================================
       CREATE CARDS
    ===================================================== */

  books.forEach((book) => {
    const card = createReadingCard(book);

    readingContainer.appendChild(card);
  });
}

/* =========================================================
   LIBRARY FILTER BUTTONS
========================================================= */

const libraryFilterButtons = document.querySelectorAll(".library-filter-btn");

libraryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentLibraryFilter = button.dataset.filter;

    /* -----------------------------------------
                   ACTIVE STATE
                ----------------------------------------- */

    libraryFilterButtons.forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    renderLibrary();
  });
});

/* =========================================================
   SEARCH
========================================================= */

function searchBooks() {
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    renderLibrary();

    return;
  }

  const results = myLibrary.filter((book) => {
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  renderSearchResults(results);
}

/* =========================================================
   RENDER SEARCH RESULTS
========================================================= */

function renderSearchResults(books) {
  bookContainer.innerHTML = "";

  if (books.length === 0) {
    if (libraryEmpty) {
      libraryEmpty.style.display = "block";

      libraryEmpty.textContent = "No books found.";
    }

    return;
  }

  if (libraryEmpty) {
    libraryEmpty.style.display = "none";
  }

  books.forEach((book) => {
    const card = createBookCard(book);

    bookContainer.appendChild(card);
  });
}

/* =========================================================
   SEARCH EVENTS
========================================================= */

searchBtn.addEventListener("click", searchBooks);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();

    searchBooks();
  }
});

/* =========================================================
   CLEAR SEARCH WHEN INPUT EMPTY
========================================================= */

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    renderLibrary();
  }
});

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {
  renderLibrary();

  renderCurrentlyReading();
}

/* =========================================================
   OPEN BOOK DETAILS
========================================================= */

function openBookDetails(id) {
  const book = myLibrary.find((item) => item.id === id);

  if (!book) {
    return;
  }

  renderBookDetails(book);

  if (bookDetails) {
    bookDetails.classList.remove("empty");

    bookDetails.classList.add("open");
  }
}

/* =========================================================
   CLOSE BOOK DETAILS
========================================================= */

function closeBookDetails() {
  if (!bookDetails) {
    return;
  }

  bookDetails.classList.remove("open");
}

/* =========================================================
   RENDER BOOK DETAILS
========================================================= */

function renderBookDetails(book) {
  if (!bookDetails) {
    return;
  }

  bookDetails.innerHTML = "";

  /* =====================================================
       DETAILS WRAPPER
    ===================================================== */

  const detailsBook = document.createElement("div");

  detailsBook.classList.add("details-book");

  /* =====================================================
       TITLE
    ===================================================== */

  const title = document.createElement("h2");

  title.classList.add("details-title");

  title.textContent = book.title;

  /* =====================================================
       AUTHOR
    ===================================================== */

  const author = document.createElement("p");

  author.classList.add("details-author");

  author.textContent = `by ${book.author}`;

  /* =====================================================
       STATUS
    ===================================================== */

  const status = document.createElement("p");

  status.classList.add("details-status");

  status.textContent = statusText[book.status];

  /* =====================================================
       BASIC INFO
    ===================================================== */

  const info = document.createElement("div");

  info.classList.add("details-info");

  const pages = document.createElement("p");

  pages.innerHTML = `<strong>Pages</strong>
         <span>${book.pages}</span>`;

  info.append(pages);

  /* =====================================================
       CURRENT PAGE
    ===================================================== */

  if (book.status === "reading") {
    const currentPage = document.createElement("p");

    currentPage.innerHTML = `<strong>Current page</strong>
             <span>
                ${book.currentPage} / ${book.pages}
             </span>`;

    info.append(currentPage);
  }

  /* =====================================================
       START DATE
    ===================================================== */

  if (book.startedAt) {
    const started = document.createElement("p");

    started.innerHTML = `<strong>Started</strong>
             <span>
                ${formatDate(book.startedAt)}
             </span>`;

    info.append(started);
  }

  /* =====================================================
       FINISH DATE
    ===================================================== */

  if (book.finishedAt) {
    const finished = document.createElement("p");

    finished.innerHTML = `<strong>Finished</strong>
             <span>
                ${formatDate(book.finishedAt)}
             </span>`;

    info.append(finished);
  }

  /* =====================================================
       READING DURATION
    ===================================================== */

  if (book.startedAt && (book.status === "reading" || book.status === "read")) {
    const duration = document.createElement("p");

    duration.innerHTML = `<strong>Reading time</strong>
             <span>
                ${getReadingDuration(book)}
             </span>`;

    info.append(duration);
  }

  /* =====================================================
       PROGRESS
    ===================================================== */

  if (book.status === "reading") {
    const progressWrapper = document.createElement("div");

    progressWrapper.classList.add("details-progress");

    const progressTrack = document.createElement("div");

    progressTrack.classList.add("details-progress-track");

    const progressBar = document.createElement("div");

    progressBar.classList.add("details-progress-bar");

    const percent = getReadingProgress(book);

    progressBar.style.width = `${percent}%`;

    progressTrack.append(progressBar);

    const progressText = document.createElement("span");

    progressText.classList.add("details-progress-text");

    progressText.textContent = `${Math.round(percent)}% read`;

    progressWrapper.append(progressTrack, progressText);

    info.append(progressWrapper);
  }

  /* =====================================================
       QUOTE
    ===================================================== */

  const quote = document.createElement("blockquote");

  quote.classList.add("details-quote");

  quote.textContent = "A room without books is like a body without a soul.";

  const quoteAuthor = document.createElement("cite");

  quoteAuthor.textContent = "— Cicero";

  quote.append(quoteAuthor);

  /* =====================================================
       ACTIONS
    ===================================================== */

  const actions = document.createElement("div");

  actions.classList.add("details-actions");

  /* =====================================================
       START READING
    ===================================================== */

  if (book.status === "not-read") {
    const startButton = document.createElement("button");

    startButton.type = "button";

    startButton.textContent = "Start Reading";

    startButton.classList.add("start-reading-btn");

    startButton.addEventListener("click", () => {
      startReading(book.id);
    });

    actions.append(startButton);
  }

  /* =====================================================
       FINISH READING
    ===================================================== */

  if (book.status === "reading") {
    const finishButton = document.createElement("button");

    finishButton.type = "button";

    finishButton.textContent = "Finish Reading";

    finishButton.classList.add("finish-reading-btn");

    finishButton.addEventListener("click", () => {
      finishReading(book.id);
    });

    actions.append(finishButton);
  }

  /* =====================================================
       EDIT
    ===================================================== */

  const editButton = document.createElement("button");

  editButton.type = "button";

  editButton.textContent = "Edit";

  editButton.classList.add("edit-btn");

  editButton.addEventListener("click", () => {
    openEditBookModal(book);
  });

  /* =====================================================
       DELETE
    ===================================================== */

  const deleteButton = document.createElement("button");

  deleteButton.type = "button";

  deleteButton.textContent = "Delete";

  deleteButton.classList.add("delete-btn");

  deleteButton.addEventListener("click", () => {
    openDeleteDialog(book.id);
  });

  actions.append(editButton, deleteButton);

  /* =====================================================
       APPEND EVERYTHING
    ===================================================== */

  detailsBook.append(title, author, status, info, quote, actions);

  bookDetails.appendChild(detailsBook);
}

/* =========================================================
   GET READING PROGRESS
========================================================= */

function getReadingProgress(book) {
  if (!book || !book.pages || book.pages <= 0) {
    return 0;
  }

  const progress = (book.currentPage / book.pages) * 100;

  return Math.min(100, Math.max(0, progress));
}

/* =========================================================
   START READING
========================================================= */

function startReading(id) {
  const book = myLibrary.find((item) => item.id === id);

  if (!book) {
    return;
  }

  if (book.status === "reading") {
    return;
  }

  book.status = "reading";

  book.startedAt = new Date();

  book.finishedAt = null;

  if (book.currentPage === null || book.currentPage === undefined) {
    book.currentPage = 0;
  }

  saveLibrary();

  renderAll();

  renderBookDetails(book);

  showAlert(`You started "${book.title}" 📖`);
}

/* =========================================================
   FINISH READING
========================================================= */

function finishReading(id) {
  const book = myLibrary.find((item) => item.id === id);

  if (!book) {
    return;
  }

  /* =====================================================
       CHECK CURRENT PAGE
    ===================================================== */

  if (Number(book.currentPage) < Number(book.pages)) {
    showAlert(`You are on page ${book.currentPage}. Finish the book first!`);

    return;
  }

  /* =====================================================
       UPDATE BOOK
    ===================================================== */

  book.status = "read";

  book.currentPage = book.pages;

  book.finishedAt = new Date();

  if (!book.startedAt) {
    book.startedAt = new Date();
  }

  saveLibrary();

  renderAll();

  renderBookDetails(book);

  showAlert(`Congratulations! You finished "${book.title}" 🎉`);
}

/* =========================================================
   DETAILS CLOSE BUTTON
========================================================= */

const closeDetailsBtn = document.getElementById("close-details");

if (closeDetailsBtn) {
  closeDetailsBtn.addEventListener("click", closeBookDetails);
}

/* =========================================================
   CLICK OUTSIDE DETAILS
========================================================= */

if (bookDetails) {
  bookDetails.addEventListener("click", (event) => {
    if (event.target === bookDetails) {
      closeBookDetails();
    }
  });
}

/* =========================================================
   UPDATE CURRENT PAGE
========================================================= */

function updateCurrentPage(id, value) {
  const book = myLibrary.find((item) => item.id === id);

  if (!book) {
    return;
  }

  /* =====================================================
       CONVERT INPUT
    ===================================================== */

  let page = Number(value);

  /* =====================================================
       VALIDATE NUMBER
    ===================================================== */

  if (Number.isNaN(page)) {
    showAlert("Please enter a valid page number.");

    return;
  }

  /* =====================================================
       KEEP PAGE INSIDE RANGE
    ===================================================== */

  page = Math.max(0, Math.min(page, book.pages));

  /* =====================================================
       UPDATE
    ===================================================== */

  book.currentPage = page;

  /* =====================================================
       IF LAST PAGE
    ===================================================== */

  if (page >= book.pages) {
    book.currentPage = book.pages;

    saveLibrary();

    renderAll();

    renderBookDetails(book);

    showAlert("You reached the last page. You can finish the book now! 🎉");

    return;
  }

  /* =====================================================
       NORMAL UPDATE
    ===================================================== */

  saveLibrary();

  renderAll();

  renderBookDetails(book);

  showAlert(`Page ${page} saved.`);
}

/* =========================================================
   GET READING DURATION
========================================================= */

function getReadingDuration(book) {
  if (!book || !book.startedAt) {
    return "—";
  }

  const start = new Date(book.startedAt);

  /*
       For a finished book:
       use finishedAt.

       For a currently reading book:
       use now.
    */

  const end = book.finishedAt ? new Date(book.finishedAt) : new Date();

  const difference = end.getTime() - start.getTime();

  if (difference <= 0) {
    return "Less than a day";
  }

  const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));

  const totalHours = Math.floor(difference / (1000 * 60 * 60));

  /* =====================================================
       LESS THAN ONE DAY
    ===================================================== */

  if (totalDays === 0) {
    if (totalHours === 0) {
      return "Less than an hour";
    }

    return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
  }

  /* =====================================================
       DAYS
    ===================================================== */

  if (totalDays < 30) {
    return `${totalDays} ${totalDays === 1 ? "day" : "days"}`;
  }

  /* =====================================================
       MONTHS
    ===================================================== */

  const months = Math.floor(totalDays / 30);

  if (months < 12) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  /* =====================================================
       YEARS
    ===================================================== */

  const years = Math.floor(months / 12);

  return `${years} ${years === 1 ? "year" : "years"}`;
}

/* =========================================================
   CREATE PAGE TRACKER
========================================================= */

function createPageTracker(book) {
  const pageBox = document.createElement("div");

  pageBox.classList.add("page-info");

  /* =====================================================
       CURRENT PAGE TEXT
    ===================================================== */

  const pageText = document.createElement("p");

  pageText.classList.add("current-page");

  pageText.textContent = `${book.currentPage} / ${book.pages}`;

  /* =====================================================
       INPUT
    ===================================================== */

  const input = document.createElement("input");

  input.type = "number";

  input.min = "0";

  input.max = String(book.pages);

  input.value = book.currentPage;

  input.classList.add("page-input");

  input.setAttribute("aria-label", "Current page");

  /* =====================================================
       SAVE BUTTON
    ===================================================== */

  const saveButton = document.createElement("button");

  saveButton.type = "button";

  saveButton.classList.add("save-page-btn");

  saveButton.textContent = "Save";

  saveButton.addEventListener("click", () => {
    updateCurrentPage(book.id, input.value);
  });

  /* =====================================================
       ENTER TO SAVE
    ===================================================== */

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      updateCurrentPage(book.id, input.value);
    }
  });

  /* =====================================================
       PROGRESS WRAPPER
    ===================================================== */

  const progressWrapper = document.createElement("div");

  progressWrapper.classList.add("progress-wrapper");

  /* =====================================================
       PROGRESS TRACK
    ===================================================== */

  const progress = document.createElement("div");

  progress.classList.add("reading-progress");

  /* =====================================================
       PROGRESS BAR
    ===================================================== */

  const progressBar = document.createElement("div");

  progressBar.classList.add("reading-progress-bar");

  const percent = getReadingProgress(book);

  progressBar.style.width = `${percent}%`;

  progress.append(progressBar);

  progressWrapper.append(progress);

  /* =====================================================
       APPEND
    ===================================================== */

  pageBox.append(pageText, input, saveButton, progressWrapper);

  return pageBox;
}

/* =========================================================
   UPDATE READING CARD
========================================================= */

function updateReadingCard(book) {
  const card = readingContainer.querySelector(`[data-id="${book.id}"]`);

  if (!card) {
    return;
  }

  const page = card.querySelector(".reading-page");

  if (page) {
    page.textContent = `${book.currentPage} / ${book.pages}`;
  }
}

/* =========================================================
   ADD PAGE TRACKER TO READING DETAILS
========================================================= */

function addPageTrackerToDetails(book) {
  if (!bookDetails || book.status !== "reading") {
    return;
  }

  const existing = bookDetails.querySelector(".details-page-tracker");

  if (existing) {
    existing.remove();
  }

  const tracker = createPageTracker(book);

  tracker.classList.add("details-page-tracker");

  const detailsInfo = bookDetails.querySelector(".details-info");

  if (detailsInfo) {
    detailsInfo.appendChild(tracker);
  }
}

/* =========================================================
   AUTO UPDATE READING TIME
========================================================= */

function refreshReadingTimes() {
  const readingBooks = myLibrary.filter((book) => book.status === "reading");

  readingBooks.forEach((book) => {
    const card = readingContainer.querySelector(`[data-id="${book.id}"]`);

    if (!card) {
      return;
    }

    const duration = card.querySelector(".book-duration");

    if (duration) {
      duration.textContent = `Reading time: ${getReadingDuration(book)}`;
    }
  });
}

/* =========================================================
   REFRESH EVERY MINUTE
========================================================= */

setInterval(refreshReadingTimes, 60 * 1000);

/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteDialog(id) {
  const book = myLibrary.find((item) => item.id === id);

  if (!book) {
    return;
  }

  deleteBookId = id;

  if (deleteDialog) {
    deleteDialog.classList.add("open");

    deleteDialog.showModal();
  }
}

/* =========================================================
   CLOSE DELETE MODAL
========================================================= */

function closeDeleteDialog() {
  deleteBookId = null;

  if (deleteDialog) {
    deleteDialog.classList.remove("open");

    if (deleteDialog.open) {
      deleteDialog.close();
    }
  }
}

/* =========================================================
   CONFIRM DELETE
========================================================= */

function confirmDelete() {
  if (!deleteBookId) {
    return;
  }

  const index = myLibrary.findIndex((book) => book.id === deleteBookId);

  if (index === -1) {
    closeDeleteDialog();

    return;
  }

  const deletedBook = myLibrary[index];

  myLibrary.splice(index, 1);

  saveLibrary();

  closeDeleteDialog();

  if (bookDetails) {
    closeBookDetails();
  }

  renderAll();

  updateStats();

  renderChart();

  showAlert(`"${deletedBook.title}" was removed from your library.`);
}

/* =========================================================
   DELETE MODAL EVENTS
========================================================= */

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", confirmDelete);
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", closeDeleteDialog);
}

/* =========================================================
   CLOSE DELETE MODAL WITH ESC
========================================================= */

if (deleteDialog) {
  deleteDialog.addEventListener("cancel", (event) => {
    event.preventDefault();

    closeDeleteDialog();
  });

  deleteDialog.addEventListener("click", (event) => {
    if (event.target === deleteDialog) {
      closeDeleteDialog();
    }
  });
}

/* =========================================================
   ALERT
========================================================= */

function showAlert(message) {
  /*
       If there is no dedicated alert container,
       create one automatically.
    */

  let container = alertContainer;

  if (!container) {
    container = document.createElement("div");

    container.id = "alert-container";

    document.body.appendChild(container);
  }

  const alert = document.createElement("div");

  alert.classList.add("alert");

  alert.textContent = message;

  container.appendChild(alert);

  /* =====================================================
       AUTO REMOVE
    ===================================================== */

  setTimeout(() => {
    alert.classList.add("alert-hide");

    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 3000);
}

/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStats() {
  const total = myLibrary.length;

  const read = myLibrary.filter((book) => book.status === "read").length;

  const reading = myLibrary.filter((book) => book.status === "reading").length;

  const notRead = myLibrary.filter((book) => book.status === "not-read").length;

  /* =====================================================
       TOTAL
    ===================================================== */

  if (totalBooksElement) {
    totalBooksElement.textContent = total;
  }

  /* =====================================================
       READ
    ===================================================== */

  if (booksReadElement) {
    booksReadElement.textContent = read;
  }

  /* =====================================================
       READING
    ===================================================== */

  if (booksReadingElement) {
    booksReadingElement.textContent = reading;
  }

  /* =====================================================
       OPTIONAL NOT READ ELEMENT
    ===================================================== */

  const booksNotReadElement = document.getElementById("books-not-read");

  if (booksNotReadElement) {
    booksNotReadElement.textContent = notRead;
  }

  /* =====================================================
       OPTIONAL PAGES
    ===================================================== */

  const pagesReadElement = document.getElementById("pages-read");

  if (pagesReadElement) {
    const pages = myLibrary
      .filter((book) => book.status === "read")
      .reduce((totalPages, book) => {
        return totalPages + Number(book.pages);
      }, 0);

    pagesReadElement.textContent = pages;
  }
}

/* =========================================================
   CHART DATA
========================================================= */

function getChartData() {
  const read = myLibrary.filter((book) => book.status === "read").length;

  const reading = myLibrary.filter((book) => book.status === "reading").length;

  const notRead = myLibrary.filter((book) => book.status === "not-read").length;

  return {
    read,
    reading,
    notRead,
  };
}

/* =========================================================
   RENDER CHART
========================================================= */

function renderChart() {
  if (!chartCanvas) {
    return;
  }

  const ctx = chartCanvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const data = getChartData();

  const width = chartCanvas.width;

  const height = chartCanvas.height;

  ctx.clearRect(0, 0, width, height);

  /* =====================================================
       EMPTY CHART
    ===================================================== */

  const total = data.read + data.reading + data.notRead;

  if (total === 0) {
    ctx.font = "16px Nunito";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillStyle = "#705b48";

    ctx.fillText("Your reading chart is empty.", width / 2, height / 2);

    return;
  }

  /* =====================================================
       BAR CHART
    ===================================================== */

  const values = [data.read, data.reading, data.notRead];

  const labels = ["Read", "Reading", "Not Read"];

  const colors = ["#1a8032", "#d9b86a", "#9a7138"];

  const maxValue = Math.max(...values, 1);

  const padding = 45;

  const chartWidth = width - padding * 2;

  const chartHeight = height - padding * 2;

  const barGap = 35;

  const barWidth = (chartWidth - barGap * 2) / 3;

  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * (chartHeight - 35);

    const x = padding + index * (barWidth + barGap);

    const y = height - padding - barHeight;

    /* ---------------------------------------------
               BAR
            --------------------------------------------- */

    ctx.fillStyle = colors[index];

    ctx.beginPath();

    ctx.roundRect(x, y, barWidth, barHeight, 10);

    ctx.fill();

    /* ---------------------------------------------
               VALUE
            --------------------------------------------- */

    ctx.fillStyle = "#2d2119";

    ctx.font = "700 16px Nunito";

    ctx.textAlign = "center";

    ctx.textBaseline = "bottom";

    ctx.fillText(value, x + barWidth / 2, y - 6);

    /* ---------------------------------------------
               LABEL
            --------------------------------------------- */

    ctx.font = "14px Nunito";

    ctx.textBaseline = "top";

    ctx.fillText(labels[index], x + barWidth / 2, height - padding + 10);
  });
}

/* =========================================================
   CHART FILTERS
========================================================= */

const chartFilterButtons = document.querySelectorAll(".stats-filter-btn");

chartFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentChartPeriod = button.dataset.period || "all";

    chartFilterButtons.forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    renderChart();
  });
});

/* =========================================================
   UPDATE EVERYTHING RELATED TO STATS
========================================================= */

function updateStatsAndChart() {
  updateStats();

  renderChart();
}

/* =========================================================
   NAVIGATION ELEMENTS
========================================================= */

const navButtons = document.querySelectorAll("[data-page]");

const pages = document.querySelectorAll(".app-page");

/* =========================================================
   SHOW PAGE
========================================================= */

function showPage(pageName) {
  if (!pageName) {
    return;
  }

  /* =====================================================
       HIDE ALL PAGES
    ===================================================== */

  pages.forEach((page) => {
    page.classList.remove("active");
  });

  /* =====================================================
       SHOW TARGET PAGE
    ===================================================== */

  const target = document.querySelector(`[data-page-content="${pageName}"]`);

  if (target) {
    target.classList.add("active");
  }

  /* =====================================================
       ACTIVE NAV BUTTON
    ===================================================== */

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  /* =====================================================
       PAGE-SPECIFIC UPDATES
    ===================================================== */

  if (pageName === "library") {
    renderLibrary();
  }

  if (pageName === "reading") {
    renderCurrentlyReading();
  }

  if (pageName === "chart") {
    updateStatsAndChart();
  }

  /* =====================================================
       CLOSE MOBILE MENU
    ===================================================== */

  closeMenu();
}

/* =========================================================
   NAVIGATION EVENTS
========================================================= */

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

/* =========================================================
   MENU
========================================================= */

const menuButton = document.getElementById("menu-btn");

const menu = document.getElementById("main-menu");

function openMenu() {
  if (!menu) {
    return;
  }

  menu.classList.add("open");

  if (menuButton) {
    menuButton.setAttribute("aria-expanded", "true");
  }
}

function closeMenu() {
  if (!menu) {
    return;
  }

  menu.classList.remove("open");

  if (menuButton) {
    menuButton.setAttribute("aria-expanded", "false");
  }
}

function toggleMenu() {
  if (!menu) {
    return;
  }

  menu.classList.toggle("open");

  if (menuButton) {
    const isOpen = menu.classList.contains("open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
  }
}

if (menuButton) {
  menuButton.addEventListener("click", toggleMenu);
}

/* =========================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener("click", (event) => {
  if (!menu || !menuButton) {
    return;
  }

  const clickedInsideMenu = menu.contains(event.target);

  const clickedButton = menuButton.contains(event.target);

  if (!clickedInsideMenu && !clickedButton) {
    closeMenu();
  }
});

/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();

    closeBookDetails();

    closeDeleteDialog();
  }
});

/* =========================================================
   THEME
========================================================= */

if (themeButton) {
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const dark = document.body.classList.contains("dark-mode");

    localStorage.setItem("cozy-library-theme", dark ? "dark" : "light");
  });
}

/* =========================================================
   LOAD THEME
========================================================= */

function loadTheme() {
  const savedTheme = localStorage.getItem("cozy-library-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
}

/* =========================================================
   ADD BOOK BUTTON
========================================================= */

if (addBookButton) {
  addBookButton.addEventListener("click", () => {
    openAddBookModal();
  });
}

/* =========================================================
   CLOSE BOOK MODAL
========================================================= */

if (closeBookButton) {
  closeBookButton.addEventListener("click", () => {
    closeBookModal();
  });
}

/* =========================================================
   ADD / EDIT FORM
========================================================= */

if (bookForm) {
  bookForm.addEventListener("submit", handleBookSubmit);
}

/* =========================================================
   DIALOG CLICK OUTSIDE
========================================================= */

if (bookModal) {
  bookModal.addEventListener("click", (event) => {
    if (event.target === bookModal) {
      closeBookModal();
    }
  });
}

/* =========================================================
   DEFAULT PAGE
========================================================= */

function loadDefaultPage() {
  const savedPage = sessionStorage.getItem("cozy-library-page");

  if (savedPage) {
    const pageExists = document.querySelector(
      `[data-page-content="${savedPage}"]`,
    );

    if (pageExists) {
      showPage(savedPage);

      return;
    }
  }

  showPage("home");
}

/* =========================================================
   SAVE CURRENT PAGE
========================================================= */

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sessionStorage.setItem("cozy-library-page", button.dataset.page);
  });
});

/* =========================================================
   INITIAL RENDER
========================================================= */

function initializeLibrary() {
  loadTheme();

  /* =====================================================
       INITIAL DATA
    ===================================================== */

  loadLibrary();

  /* =====================================================
       RENDER
    ===================================================== */

  renderAll();

  updateStatsAndChart();

  /* =====================================================
       DEFAULT PAGE
    ===================================================== */

  loadDefaultPage();
}

/* =========================================================
   WINDOW LOAD
========================================================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeLibrary);
} else {
  initializeLibrary();
}

/* =========================================================
   WINDOW RESIZE
========================================================= */

let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    if (typeof renderChart === "function") {
      renderChart();
    }
  }, 150);
});

/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener("beforeunload", () => {
  saveLibrary();
});

/* =========================================================
   FINAL MESSAGE
========================================================= */

console.log("📚 Cozy Library initialized successfully.");

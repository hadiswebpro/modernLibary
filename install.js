let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    const installButton = document.querySelector("#install-app");

    if (installButton) {
        installButton.hidden = false;

        installButton.addEventListener("click", async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();

            await deferredPrompt.userChoice;

            deferredPrompt = null;
            installButton.hidden = true;
        });
    }
});

window.addEventListener("appinstalled", () => {
    deferredPrompt = null;

    const installButton = document.querySelector("#install-app");

    if (installButton) {
        installButton.hidden = true;
    }
});
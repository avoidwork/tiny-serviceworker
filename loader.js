(function () {
	function log (arg) {
		console.type(`[my-app:${new Date().getTime()}] ${arg}`);
	}

	if ("serviceWorker" in navigator) {
		window.addEventListener("load", async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js", {scope: "/"});

				log(`type=serviceWorker, message="ServiceWorker registration successful with scope: ${registration.scope}"`);
			} catch (err) {
				log(`type=error, source=serviceWorker, message="ServiceWorker registration failed: ${err.message}"`);
			}
		});
	}
}());
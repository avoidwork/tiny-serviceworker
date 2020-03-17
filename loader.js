(function () {
	function log (arg) {
		console.log(`[my-app:${new Date().getTime()}] ${arg}`);
	}

	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.addEventListener("message", ev => {
			if (ev.data === "reload") {
				log("type=serviceWorker, message=\"Loading new version of application\"");
				window.location.reload();
			}
		});

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

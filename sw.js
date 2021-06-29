"use strict";

const version = 1,
	name = `my-app-v${version}`,
	timeout = 1800,
	urls = ["/", "/manifest.json"],
	reload = false,
	safari = true,
	announce = true,
	cacheable = arg => (arg.includes("no-store") || arg.includes("max-age=0")) === false;

function log (arg) {
	console.log(`[serviceWorker:${new Date().getTime()}] ${arg}`);
}

if (safari || (/Version\/[\d+\.]+ Safari/).test(navigator.userAgent) === false) {
	self.addEventListener("activate", ev => ev.waitUntil(caches.keys().then(args => {
		const invalid = args.filter(i => i !== name);
		let result;

		if (args.includes(name) === false) {
			caches.open(name).then(cache => {
				log("type=activate, cached=false, message=\"Caching core assets\"");

				return cache.addAll(urls);
			}).catch(err => log(`type=error, action=activate, message="${err.message}"`));
		} else {
			log("type=activate, cached=true, message=\"Reusing cached core assets\"");
		}

		if (announce) {
			self.clients.matchAll().then(clients => clients.forEach(client => client.postMessage(`version_${version}`)));
		}

		if (invalid.length === 0) {
			log("type=delete, message=\"No stale caches\"");
			result = Promise.resolve();
		} else {
			log(`type=delete, message="Stale caches: ${invalid.toString()}"`);
			result = Promise.all(invalid.map(i => {
				log(`type=delete, message="Deleted stale cache ${i}"`);
				caches.delete(i);

				if (reload) {
					self.clients.claim();
					self.clients.matchAll().then(clients => clients.forEach(client => {
						log("type=reload, message=\"Loading new version of application\"");
						client.postMessage("reload");
					}));
				}
			}));
		}

		return result;
	}).catch(() => void 0)));

	self.addEventListener("install", ev => {
		self.skipWaiting();
		ev.waitUntil(() => log("type=install, message=\"New service worker installed\""));
	});

	self.addEventListener("fetch", ev => ev.respondWith(caches.open(name).then(cache => {
		const method = ev.request.method;
		let result;

		if (method === "GET") {
			result = cache.match(ev.request).then(cached => {
				const now = new Date().getTime();
				let lresult;

				if (cached !== void 0) {
					const url = new URL(cached.url),
						cdate = cached.headers.get("date"),
						then = (cdate !== null ? new Date(cdate) : new Date()).getTime() + Number((cached.headers.get("cache-control") || "").replace(/[^\d]/g, "") || timeout) * 1e3;

					if (urls.includes(url.pathname) || then > now) {
						lresult = cached.clone();
					}
				}

				if (lresult === void 0) {
					lresult = fetch(ev.request).then(res => {
						if ((res.type === "basic" || res.type === "cors") && res.status === 200 && cacheable(res.headers.get("cache-control") || "")) {
							cache.put(ev.request, res.clone());
						}

						return res;
					});
				}

				return lresult;
			});
		} else {
			result = fetch(ev.request).then(res => {
				if ((res.type === "basic" || res.type === "cors") && res.status >= 200 && res.status < 400 && method !== "HEAD" && method !== "OPTIONS") {
					cache.delete(ev.request, {ignoreMethod: true});
				}

				return res;
			});
		}

		return result;
	}).catch(() => void 0)));
}

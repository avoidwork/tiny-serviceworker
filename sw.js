"use strict";

const version = 1,
	name = `my-app-v${version}`,
	timeout = 1800,
	urls = ["/", "/manifest.json"],
	failover = "",
	reload = false,
	cacheable = arg => (arg.includes("no-store") || arg.includes("max-age=0")) === false;

async function error (err, cache, reject) {
	let cached, result;

	if (failover.length > 0) {
		cached = await cache.match(failover);

		if (cached !== void 0) {
			result = cached.clone();
		}
	}

	if (result === void 0) {
		reject(err);
	}

	return result;
}

function log (arg) {
	console.log(`[serviceWorker:${new Date().getTime()}] ${arg}`);
}

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

	if (invalid.length === 0) {
		log("type=delete, message=\"No stale caches\"");
		result = Promise.resolve();
	} else {
		log(`type=delete, message="Stale caches: ${invalid.toString()}"`);
		result = Promise.all(invalid.map(async i => {
			log(`type=delete, message="Deleted stale cache ${i}"`);
			await caches.delete(i);

			if (reload) {
				await self.clients.claim();
				self.clients.matchAll().then(clients => clients.forEach(client => {
					log("type=reload, message=\"Loading new version of application\"");
					client.postMessage("reload");
				}));
			}
		}));
	}

	return result;
}).catch(() => void 0)));

self.addEventListener("install", async ev => {
	self.skipWaiting();
	ev.waitUntil(() => log("type=install, message=\"New service worker installed\""));
});

self.addEventListener("fetch", ev => ev.respondWith(new Promise(async (resolve, reject) => {
	const cache = await caches.open(name),
		method = ev.request.method;
	let result;

	if (method === "GET") {
		const cached = await cache.match(ev.request),
			now = new Date().getTime();

		if (cached !== void 0) {
			const url = new URL(cached.url),
				cdate = cached.headers.get("date"),
				then = (cdate !== null ? new Date(cdate) : new Date()).getTime() + Number((cached.headers.get("cache-control") || "").replace(/[^\d]/g, "") || timeout) * 1e3;

			if (urls.includes(url.pathname) || then > now) {
				result = cached.clone();
				resolve(result);
			}
		}

		if (result === void 0) {
			fetch(ev.request).then(res => {
				if ((res.type === "basic" || res.type === "cors") && res.status === 200 && cacheable(res.headers.get("cache-control") || "")) {
					cache.put(ev.request, res.clone());
				}

				resolve(res);
			}).catch(err => error(err, cache, reject));
		}
	} else {
		fetch(ev.request).then(res => {
			if ((res.type === "basic" || res.type === "cors") && res.status >= 200 && res.status < 400 && method !== "HEAD" && method !== "OPTIONS") {
				cache.delete(ev.request, {ignoreMethod: true});
			}

			resolve(res);
		}).catch(err => error(err, cache, reject));
	}
})));

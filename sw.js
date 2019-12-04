"use strict";

const version = 1,
	name = `my-app-v${version}`,
	timeout = 1800,
	urls = ["/", "/manifest.json"],
	failover = "",
	cacheable = arg => (arg.includes("no-store") || arg.includes("max-age=0")) === false;

async function error (cache) {
	let result;

	if (failover.length > 0) {
		result = await cache.match(failover);
	}

	return result !== void 0 ? result : Response.error();
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
		result = Promise.all(invalid.map(i => {
			log(`type=delete, message="Deleted stale cache ${i}"`);
			caches.delete(i);
		}));
	}

	return result;
}).catch(() => void 0)));

self.addEventListener("install", ev => {
	self.skipWaiting();
	ev.waitUntil(() => log("type=install, message=\"New service worker installed\""));
});

self.addEventListener("fetch", ev => ev.respondWith(new Promise(async resolve => {
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
			}
		}

		if (result === void 0) {
			result = fetch(ev.request).then(res => {
				if ((res.type === "basic" || res.type === "cors") && res.status === 200 && cacheable(res.headers.get("cache-control") || "")) {
					cache.put(ev.request, res.clone());
				}

				return res;
			}).catch(() => error(cache));
		}
	} else {
		result = fetch(ev.request).then(res => {
			if ((res.type === "basic" || res.type === "cors") && res.status >= 200 && res.status < 400 && method !== "HEAD" && method !== "OPTIONS") {
				cache.delete(ev.request, {ignoreMethod: true});
			}

			return res;
		}).catch(() => error(cache));
	}

	resolve(result);
})));

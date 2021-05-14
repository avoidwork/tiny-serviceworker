"use strict";

const version = 1,
	name = `my-app-v${version}`,
	timeout = 1800,
	urls = ["/", "/manifest.json"],
	failover = "",
	reload = false,
	safari = true,
	cacheable = arg => (arg.includes("no-store") || arg.includes("max-age=0")) === false;

async function handle (ev = {}, cache = {}, resolve = () => void 0, reject = () => void 0, cb = async () => void 0) {
	let lerr, res, valid;

	try {
		res = await fetch(ev.request);
		await cb(res);
		valid = true;
	} catch (err) {
		lerr = err;
		valid = false;
	}

	if (valid) {
		resolve(res);
	} else {
		let result;

		if (failover.length > 0) {
			const cached = await cache.match(failover);

			if (cached !== void 0) {
				result = cached.clone();
			}
		}

		if (result !== void 0) {
			resolve(result);
		} else {
			reject(lerr);
		}
	}
}

function log (arg) {
	console.log(`[serviceWorker:${new Date().getTime()}] ${arg}`);
}

if (safari || (/Version\/[\d+\.]+ Safari/).test(navigator.userAgent) === false) {
	self.addEventListener("activate", ev => ev.waitUntil(async () => {
		const args = await caches.keys(),
			invalid = args.filter(i => i !== name);
		let reloading = false;

		if (invalid.length === 0) {
			log("type=delete, message=\"No stale caches\"");
		} else {
			log(`type=delete, message="Stale caches: ${invalid.toString()}"`);

			for (const i of invalid.values()) {
				await caches.delete(i);
				log(`type=delete, message="Deleted stale cache ${i}"`);
			}

			if (reload) {
				await self.clients.claim();

				const clients = await self.clients.matchAll();

				for (const client of clients.values()) {
					log("type=reload, message=\"Loading new version of application\"");
					client.postMessage("reload");
					reloading = true;
				}
			}
		}

		if (reloading === false) {
			if (args.includes(name) === false) {
				const cache = await caches.open(name);

				log("type=activate, cached=false, message=\"Caching core assets\"");
				await cache.addAll(urls);
			} else {
				log("type=activate, cached=true, message=\"Reusing cached core assets\"");
			}
		}
	}));

	self.addEventListener("install", ev => {
		self.skipWaiting();
		ev.waitUntil(() => log("type=install, message=\"New service worker installed\""));
	});

	self.addEventListener("fetch", ev => ev.respondWith(new Promise(async (resolve, reject) => {
		const cache = await caches.open(name),
			method = ev.request.method;

		if (method === "GET") {
			const cached = await cache.match(ev.request);
			let result;

			if (cached !== void 0) {
				const url = new URL(cached.url),
					cdate = cached.headers.get("date"),
					then = (cdate !== null ? new Date(cdate) : new Date()).getTime() + Number((cached.headers.get("cache-control") || "").replace(/[^\d]/g, "") || timeout) * 1e3;

				if (urls.includes(url.pathname) || then > new Date().getTime()) {
					result = cached.clone();
					resolve(result);
				}
			}

			if (result === void 0) {
				handle(ev, cache, resolve, reject, async res => {
					if ((res.type === "basic" || res.type === "cors") && res.status === 200 && cacheable(res.headers.get("cache-control") || "")) {
						await cache.put(ev.request, res.clone());
					}
				});
			}
		} else {
			handle(ev, cache, resolve, reject, async res => {
				if ((res.type === "basic" || res.type === "cors") && res.status >= 200 && res.status < 400 && method !== "HEAD" && method !== "OPTIONS") {
					await cache.delete(ev.request, {ignoreMethod: true});
				}
			});
		}
	})));
}

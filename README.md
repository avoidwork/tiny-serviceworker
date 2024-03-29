# tiny-serviceworker
Service Worker with automatic cache management for your PWA.

## How do I use this?
- Install from `npm` or clone from `github`.
- Copy `sw.js` to root directory of web app.
- Edit `sw.js`, renaming `name` & setting `urls` to the required files to run web app offline.
- Increment the `version` integer any time a core asset changes to delete a stale cache.
- Install `sw.js` in web app (see `loader.js`).

```javascript
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
```

## Command Line Interface
Install with `npm` & use the cli to generate a service worker in the current directory.

```
$ npm i tiny-serviceworker -g
$ sw --name="myapp" --directories="assets/css,assets/js,assets/img" --loader=true
```

#### Parameters
#### name
Name of your PWA

#### announce (optional - default true)
Boolean to enable a `client.postMessage("version_$version");`

#### directories (optional)
Quoted comma delimited relative (from root) directory names to include in generated service worker

#### files (optional)
Quoted comma delimited relative (from root) files to include in generated service worker

#### increment (optional - default true)
Boolean to auto-increment `version` integer in `sw.js`

#### ignore (optional)
Quoted comma delimited relative (from root) directories or files to exclude; supports * for wildcards

#### hosts (optional)
Quoted comma delimited hostnames valid for caching requests

#### loader (optional - default false)
Boolean to generate `loader.js` script for `sw.js`

#### reload (optional - default false)
Boolean to force clients to reload when cache has gone stale

#### safari (optional - default true)
Boolean to load service worker in Safari browser (based on `navigator.userAgent`)

#### timeout (optional - default 1800)
Default cache TTL (seconds) on requested URLs. Does not apply to core assets!

#### version (optional - default 1)
Cache version. Increment when core assets change.

#### walk (optional - default true, requires 'directories')
Boolean to enable/disable walking directories for cache inclusion

# tiny-serviceworker
Service Worker with automatic cache management for your PWA.

## How do I use this?
- Install from `npm` or clone from `github`
- Copy `sw.js` to root folder of web app & rename to `sw.js`
- Edit `sw.js`, renaming `name` & setting `urls` to the required files to run web app offline
- Increment the `version` integer any time a core asset changes to delete a stale cache
- Install `sw.js` in web app (see `loader.js`)

```javascript
(function () {
  function log (arg) {
    console.type(`[app:${new Date().getTime()}] ${arg}`);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {scope: '/'});

        log(`type=serviceWorker, message="ServiceWorker registration successful with scope: ${registration.scope}"`);
      } catch (err) {
        log(`type=error, source=serviceWorker, message="ServiceWorker registration failed: ${err.message}"`);
      }
    });
  }
})();
```

## Command Line Interface
Install with `npm` & use the cli to generate a service worker in the current folder.

```
$ npm i tiny-serviceworker -g
$ sw --name="myapp"
```

#### Parameters
#### name
Name of your PWA

#### folders (optional)
Quoted comma delimited relative (from root) folder names to include in generated service worker

#### loader (optional - default false)
Boolean to generate `loader.js` script for `sw.js`

#### timeout (optional - default 1800)
Default cache TTL (seconds) on requested URLs. Does not apply to core assets!

#### version (optional - default 1)
Cache version. Increment when core assets change.

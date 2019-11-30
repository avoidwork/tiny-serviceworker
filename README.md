# tiny-serviceworker
Sample service worker with automatic cache management

## How do I use this?
- Install from `npm` or clone from `github`
- Copy the included script (`index.js`) to root folder of web app & rename to `sw.js`
- Edit `sw.js`, renaming `name` & setting `urls` to the required files to run web app offline
- Increment the `version` integer any time a core asset changes to delete a stale cache
- Install `sw.js` in web app:

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

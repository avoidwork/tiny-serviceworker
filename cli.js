#!/usr/bin/env node

const path = require("path"),
	fs = require("fs").promises,
	argv = process.argv.filter(i => i.charAt(0) === "-" && i.charAt(1) === "-").reduce((a, v) => {
		const x = v.split("--")[1].split("=");

		a[x[0]] = isNaN(x[1]) === false ? Number(x[1]) : x[1] === "true" ? true : x[1];

		return a;
	}, {}),
	opts = {
		cwd: process.cwd(),
		name: argv.name || "my-app",
		folders: argv.folders || "",
		loader: argv.loader || false,
		src: __dirname,
		timeout: argv.timeout || 18e2,
		version: argv.version || 1
	};

(async function () {
	let sw = await fs.readFile(path.join(opts.src, "sw.js"), "utf8");

	if (opts.name.length > 0) {
		sw = sw.replace("name = `my-app-v${version}`", `name = \`${opts.name}-v\$\{version\}\``);
	}

	sw = sw.replace("timeout = 18e2", `timeout = ${opts.timeout}`);
	sw = sw.replace("version = 1", `version = ${opts.version}`);

	if (opts.folders.length > 0) {
		const folders = opts.folders.split(",");
		let files = ["/"];

		for (const folder of folders) {
			const fp = path.resolve(opts.cwd, folder);

			try {
				const dir = await fs.readdir(fp, {encoding: "utf8", withFileTypes: true}),
					lfiles = dir.filter(i => i.isFile() && i.name.includes(".") && i.name.charAt(0) !== ".").map(i => `/${folder}/${i.name}`);

				files = [...files, ...lfiles];
			} catch (err) {
				console.log(`Failed to read from ${fp}`);
				process.exit(1);
			}
		}

		sw = sw.replace("urls = [\"/\"]", `urls = ${JSON.stringify(files.filter(i => i !== "/sw.js"), null, 2)}`);
	}

	await fs.writeFile(path.join(opts.cwd, "sw.js"), sw, "utf8");

	if (opts.loader) {
		let loader = await fs.readFile(path.join(opts.src, "loader.js"), "utf8");

		if (opts.name.length > 0) {
			loader = loader.replace("my-app", opts.name);
		}

		await fs.writeFile(path.join(opts.cwd, "loaded.js"), loader, "utf8");
	}

	console.log(opts.loader === false ? "Generated service worker (sw.js) script" : "Generated service worker (sw.js) & loader (loader.js) scripts");
	process.exit(0);
}());

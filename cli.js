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
		directories: argv.directories || "",
		loader: argv.loader || false,
		src: __dirname,
		timeout: argv.timeout || 18e2,
		version: argv.version || 1,
		walk: argv.walk || true
	};

async function walk (directory, files, apath = `/${directory}`) {
	let result;

	try {
		const dir = await fs.readdir(directory, {encoding: "utf8", withFileTypes: true}),
			ldirectories = dir.filter(i => i.isDirectory()).map(i => i.name),
			lfiles = dir.filter(i => i.isFile() && i.name.includes(".") && i.name.charAt(0) !== ".").map(i => `${apath}/${i.name}`);

		result = [...files, ...lfiles];

		if (opts.walk && ldirectories.length > 0) {
			for (const ldirectory of ldirectories) {
				result = await walk(path.join(directory, ldirectory), result, `${apath}/${ldirectory}`);
			}
		}
	} catch (err) {
		console.error(err.stack);
		process.exit(1);
	}

	return result;
}

(async function () {
	let sw = await fs.readFile(path.join(opts.src, "sw.js"), "utf8");

	if (opts.name.length > 0) {
		sw = sw.replace("name = `my-app-v${version}`", `name = \`${opts.name}-v\$\{version\}\``);
	}

	sw = sw.replace("timeout = 18e2", `timeout = ${opts.timeout}`);
	sw = sw.replace("version = 1", `version = ${opts.version}`);

	if (opts.directories.length > 0) {
		const directories = opts.directories.split(",");
		let files = ["/"];

		for (const directory of directories) {
			files = await walk(directory, files);
		}

		sw = sw.replace("urls = [\"/\"]", `urls = ${JSON.stringify(files.filter(i => i !== "/sw.js"))}`);
	}

	try {
		await fs.writeFile(path.join(opts.cwd, "sw.js"), sw, "utf8");
	} catch (err) {
		console.error(err.stack);
		process.exit(1);
	}

	if (opts.loader) {
		let loader = await fs.readFile(path.join(opts.src, "loader.js"), "utf8");

		if (opts.name.length > 0) {
			loader = loader.replace("my-app", opts.name);
		}

		try {
			await fs.writeFile(path.join(opts.cwd, "loaded.js"), loader, "utf8");
		} catch (err) {
			console.error(err.stack);
			process.exit(1);
		}
	}

	console.log(opts.loader === false ? "Generated service worker (sw.js) script" : "Generated service worker (sw.js) & loader (loader.js) scripts");
	process.exit(0);
}());

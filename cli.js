#!/usr/bin/env node

const path = require("path"),
	fs = require("fs").promises,
	argv = process.argv.filter(i => i.charAt(0) === "-" && i.charAt(1) === "-").reduce((a, v) => {
		const x = v.split("--")[1].split("=");

		a[x[0]] = isNaN(x[1]) === false ? Number(x[1]) : x[1] === "true" ? true : x[1] === "false" ? false : x[1];

		return a;
	}, {}),
	opts = {
		cwd: process.cwd(),
		directories: argv.directories || "",
		increment: argv.increment || true,
		ignore: new RegExp(`(${Array.from(new Set(["/sw.js", ...(argv.ignore || "").split(",").filter(i => i.length > 0)])).map(i => `/${i.replace(/^\//, "").replace(/(\/|\.)/g, "\\$1").replace(/\*/, ".*")}`).join(")|(")})$`),
		loader: argv.loader || false,
		name: argv.name || "my-app",
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
	const fp = path.join(opts.cwd, "sw.js");
	let sw = await fs.readFile(path.join(opts.src, "sw.js"), "utf8");

	if (opts.increment) {
		try {
			const lsw = await fs.readFile(fp, "utf8"),
				lversion = lsw.match(/version = (\d+)/);

			if (lversion !== null) {
				opts.version = Number(lversion[1]) + 1;
			}
		} catch (err) {
			void 0;
		}
	}

	if (opts.name.length > 0) {
		sw = sw.replace("name = `my-app-v${version}`", `name = \`${opts.name}-v\$\{version\}\``);
	}

	sw = sw.replace(/timeout = (\d+)/, `timeout = ${opts.timeout}`);
	sw = sw.replace(/version = (\d+)/, `version = ${opts.version}`);

	if (opts.directories.length > 0) {
		const directories = Array.from(new Set(opts.directories.split(",")));
		let files = ["/", "/manifest.json"];

		for (const directory of directories) {
			files = await walk(directory, files);
		}

		sw = sw.replace("urls = [\"/\", \"/manifest.json\"]", `urls = ${JSON.stringify(files.filter(i => opts.ignore.test(i) === false))}`);
	}

	try {
		await fs.writeFile(fp, sw, "utf8");
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

// Script: scripts/generate-projects.js
// Genera un manifiesto de proyectos en projects/index.json escaneando las carpetas de projects/

const fs = require('fs');
const path = require('path');

function isDirectory(p) {
	try {
		return fs.statSync(p).isDirectory();
	} catch (_) {
		return false;
	}
}

function readJson(filePath) {
	try {
		const raw = fs.readFileSync(filePath, 'utf8');
		return JSON.parse(raw);
	} catch (_) {
		return null;
	}
}

(function main() {
	const rootDir = process.cwd();
	const projectsDir = path.join(rootDir, 'projects');
	const outFile = path.join(projectsDir, 'index.json');

	if (!fs.existsSync(projectsDir)) {
		console.error('[generate-projects] No existe la carpeta projects/. Abortando.');
		process.exit(1);
	}

	const entries = fs.readdirSync(projectsDir).filter((name) => {
		if (name.startsWith('.')) return false; // ignora ocultos como .DS_Store
		const full = path.join(projectsDir, name);
		return isDirectory(full);
	});

	const manifest = [];
	for (const dirName of entries) {
		const cfgPath = path.join(projectsDir, dirName, 'config.json');
		const cfg = readJson(cfgPath);
		if (!cfg) {
			console.warn(`[generate-projects] ${dirName} omitido: no hay config.json válido`);
			continue;
		}
		manifest.push({
			id: cfg.id || dirName,
			dir: dirName,
			title: cfg.title || dirName,
			description: cfg.description || `Proyecto ${cfg.id || dirName}`,
			path: `/${dirName}/`
		});
	}

	// Ordena por titulo para una lista consistente
	manifest.sort((a, b) => a.title.localeCompare(b.title, 'es'));

	fs.writeFileSync(outFile, JSON.stringify({ projects: manifest }, null, 2), 'utf8');
	console.log(`[generate-projects] Manifiesto creado: ${outFile} con ${manifest.length} proyectos.`);
})();

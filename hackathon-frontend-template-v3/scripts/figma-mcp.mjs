import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPaths = [
	join(root, ".cursor", "mcp", "figma", "figma.env"),
	join(root, "figma.env"),
];

function loadAccessToken() {
	const fromProcess = process.env.FIGMA_ACCESS_TOKEN?.trim();
	if (fromProcess) {
		return fromProcess;
	}

	const envPath = envPaths.find((path) => existsSync(path));
	if (!envPath) {
		console.error(
			"[figma-mcp] Нет figma.env. Скопируйте .cursor/mcp/figma/figma.env.example → .cursor/mcp/figma/figma.env и задайте FIGMA_ACCESS_TOKEN.",
		);
		process.exit(1);
	}

	const content = readFileSync(envPath, "utf8");
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}
		const match = trimmed.match(/^FIGMA_ACCESS_TOKEN\s*=\s*(.*)$/);
		if (!match) {
			continue;
		}
		const value = match[1].trim().replace(/^["']|["']$/g, "");
		if (value) {
			return value;
		}
	}

	console.error("[figma-mcp] В figma.env не задан FIGMA_ACCESS_TOKEN.");
	process.exit(1);
}

const token = loadAccessToken();

const child = spawn("npx", ["-y", "figma-developer-mcp", "--figma-api-key", token], {
	cwd: root,
	stdio: "inherit",
	shell: true,
});

child.on("exit", (code) => {
	process.exit(code ?? 0);
});

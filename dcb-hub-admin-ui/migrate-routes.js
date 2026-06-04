import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, "src", "routes");

// Helper to recursively get all .tsx files
function getAllFiles(dirPath, arrayOfFiles) {
	const files = fs.readdirSync(dirPath);
	arrayOfFiles = arrayOfFiles || [];

	files.forEach((file) => {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
		} else if (file.endsWith(".tsx") && !file.startsWith("-")) {
			arrayOfFiles.push(path.join(dirPath, file));
		}
	});
	return arrayOfFiles;
}

const files = getAllFiles(routesDir);

files.forEach((filePath) => {
	let content = fs.readFileSync(filePath, "utf8");

	// Skip files that are already migrated
	if (content.includes("createFileRoute")) return;

	// Calculate the TanStack Route Path
	// e.g., src/routes/__authenticated/patronRequests/index.tsx -> /__authenticated/patronRequests/
	let routePath = filePath
		.replace(routesDir, "")
		.replace(/\\/g, "/") // Fix Windows slashes
		.replace(/\/index\.tsx$/, "/") // Handle index files
		.replace(/\.tsx$/, "/"); // Handle flat files

	if (!routePath.startsWith("/")) routePath = "/" + routePath;

	// 1. Inject the TanStack import at the top
	const importStatement = `import { createFileRoute } from "@tanstack/react-router";\n\n`;

	// 2. Look for the default export component name
	// Matches: export default function MyComponent() OR export default function MyComponent (props)
	const defaultExportRegex =
		/export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/;
	const match = content.match(defaultExportRegex);

	if (match) {
		const componentName = match[1];

		// 3. Create the TanStack Route definition
		const routeDef = `export const Route = createFileRoute("${routePath}")({\n\tcomponent: ${componentName},\n});\n\n`;

		// 4. Strip "export default" from the function definition
		content = content.replace(defaultExportRegex, `function ${componentName}(`);

		// 5. Write the file back
		const newContent = importStatement + routeDef + content;
		fs.writeFileSync(filePath, newContent, "utf8");
		console.log(`✅ Migrated: ${routePath}`);
	} else {
		console.log(
			`⚠️ Skipped (No 'export default function' found): ${routePath}`,
		);
	}
});

console.log("Migration script complete!");

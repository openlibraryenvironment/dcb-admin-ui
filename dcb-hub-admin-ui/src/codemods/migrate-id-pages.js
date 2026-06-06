import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesDir = path.join(__dirname, '..', 'routes');

function getAllFiles(dirPath, arrayOfFiles) {
	const files = fs.readdirSync(dirPath);
	arrayOfFiles = arrayOfFiles || [];
	files.forEach((file) => {
		if (fs.statSync(dirPath + '/' + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
		} else if (file.endsWith('.tsx') && !file.startsWith('-')) {
			arrayOfFiles.push(path.join(dirPath, file));
		}
	});
	return arrayOfFiles;
}

const files = getAllFiles(routesDir);

files.forEach((filePath) => {
	let content = fs.readFileSync(filePath, 'utf8');

	const hasSession = content.includes('useSession');
	const hasRouterQuery = content.includes('router.query');
	const hasGetStatic = content.includes('getStaticProps') || content.includes('getStaticPaths');
	const needsRouteInjection = !content.includes('createFileRoute');
	const hasOldQueryImports = content.includes('queries/queries');
	const hasApollo = content.includes('@apollo/client');

	if (!hasSession && !hasRouterQuery && !hasGetStatic && !needsRouteInjection && !hasOldQueryImports && !hasApollo && !content.includes('/id/')) {
		return;
	}

	let modified = false;

	// ==========================================
	// 1. HYPER-AGGRESSIVE ROUTE INJECTION
	// ==========================================
	if (needsRouteInjection) {
		let routePath = filePath
			.replace(routesDir, '')
			.replace(/\\/g, '/')
			.replace(/\/index\.tsx$/, '/')
			.replace(/\.tsx$/, '/');

		routePath = routePath.replace(/\[(.*?)\]/g, '$$$1');
		if (!routePath.startsWith('/')) routePath = '/' + routePath;

		let componentName = null;

		// 1. Look for export default function Name
		let match = content.match(/export\s+default\s+function\s+([A-Z][A-Za-z0-9_]+)/);
		if (match) componentName = match[1];

		// 2. Look for export default Name;
		if (!componentName) {
			match = content.match(/export\s+default\s+([A-Z][A-Za-z0-9_]+)\s*;/);
			if (match) componentName = match[1];
		}

		// 3. Look for const Name = () =>
		if (!componentName) {
			match = content.match(/const\s+([A-Z][A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
			if (match) componentName = match[1];
		}

		// 4. Look for function Name()
		if (!componentName) {
			match = content.match(/function\s+([A-Z][A-Za-z0-9_]+)\s*\(/);
			if (match) componentName = match[1];
		}

		if (componentName) {
			const routeDef = `export const Route = createFileRoute("${routePath}")({\n\tcomponent: ${componentName},\n});\n\n`;
			
			// Inject cleanly based on how the component was declared
			if (content.includes(`export default function ${componentName}`)) {
				content = content.replace(`export default function ${componentName}`, `${routeDef}function ${componentName}`);
			} else {
				const regex = new RegExp(`(const\\s+${componentName}\\s*=|function\\s+${componentName}\\s*\\()`);
				content = content.replace(regex, `${routeDef}$1`);
				// Strip the export default at the bottom
				content = content.replace(new RegExp(`export\\s+default\\s+${componentName}\\s*;?`), '');
			}

			content = `import { createFileRoute } from "@tanstack/react-router";\n` + content;
			modified = true;
		} else {
			console.log(`⚠️ Route Injection Skipped (Couldn't find component name): ${filePath}`);
		}
	} else if (content.includes('createFileRoute') && content.includes('/id/')) {
		// Fix manual migrations that missed the $ prefix (like requestingHistory.tsx)
		content = content.replace(/\/id\//g, '/$id/');
		modified = true;
	}

	// ==========================================
	// 2. AUTHENTICATION SWAPS
	// ==========================================
	if (hasSession) {
		if (!content.includes('useAuth')) {
			content = content.replace(/import\s+{\s*useSession\s*}\s*from\s*['"]next-auth\/react['"];?/g, 'import { useAuth } from "react-oidc-context";');
		} else {
			content = content.replace(/import\s+{\s*useSession\s*}\s*from\s*['"]next-auth\/react['"];?\n?/g, '');
		}

		const sessionRegex = /const\s+(?:\{\s*[^}]+\s*\}|[a-zA-Z0-9_]+)\s*=\s*useSession\(\s*\{[\s\S]*?\}\s*\);|const\s+(?:\{\s*[^}]+\s*\}|[a-zA-Z0-9_]+)\s*=\s*useSession\(\);/g;
		content = content.replace(sessionRegex, `const auth = useAuth();\n\tconst userRoles = (auth?.user?.profile?.roles as string[]) || [];\n\tconst isAnAdmin = userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");`);
		
		content = content.replace(/session\?\.profile\?\.roles\?\.some\(\(role:\s*string\)\s*=>\s*adminOrConsortiumAdmin\.includes\(role\),?\s*\)/g, 'isAnAdmin');
		modified = true;
	}

	// ==========================================
	// 3. ROUTER PARAMS SWAPS
	// ==========================================
	if (hasRouterQuery) {
		const routerParamsDestructureRegex = /const\s+\{\s*([a-zA-Z0-9_,\s]+)\s*\}\s*=\s*router\.query;/g;
		content = content.replace(routerParamsDestructureRegex, 'const { $1 } = Route.useParams();');

		const routerParamsDotRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*router\.query\.[a-zA-Z0-9_]+(?:\s*as\s*string)?;/g;
		content = content.replace(routerParamsDotRegex, 'const { id } = Route.useParams(); // TODO: verify parameter name matches TanStack route');
		modified = true;
	}

	// ==========================================
	// 4. STRIP NEXT.JS SERVER FUNCTIONS
	// ==========================================
	if (hasGetStatic) {
		content = content.replace(/export\s+async\s+function\s+getStatic(Props|Paths)[\s\S]*?^}/gm, '');
		modified = true;
	}

	// ==========================================
	// 5. SEPARATE QUERY IMPORTS
	// ==========================================
	if (hasOldQueryImports) {
		const queriesImportRegex = /import\s+\{([\s\S]*?)\}\s+from\s+['"](?:src\/)?queries\/queries['"];?/g;
		content = content.replace(queriesImportRegex, (match, queryList) => {
			const queries = queryList.split(',').map(q => q.trim()).filter(q => q.length > 0);
			return queries.map(q => `import { ${q} } from "@queries/${q}";`).join('\n');
		});
		modified = true;
	}

	// ==========================================
	// 6. APOLLO TO TANSTACK
	// ==========================================
	if (hasApollo) {
		content = content.replace(/import\s+{\s*useQueryClient(,\s*)?useMutation(,\s*)?useQuery\s*}\s*from\s*['"]@apollo\/client.*['"];?/g, 'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";\nimport { useGraphQLClient } from "@/hooks/useGraphQLClient";');
		content = content.replace(/import\s+{\s*useMutation(,\s*)?useQuery\s*}\s*from\s*['"]@apollo\/client.*['"];?/g, 'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";\nimport { useGraphQLClient } from "@/hooks/useGraphQLClient";');
		modified = true;
	}

	if (modified) {
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`✅ Processed: ${filePath}`);
	}
});

console.log('Universal migration script complete!');
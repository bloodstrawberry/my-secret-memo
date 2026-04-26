const fs = require('fs');
const path = require('path');

const projectRoot = 'd:\\github\\my-secret-memo';
const appDir = path.join(projectRoot, 'app');

const movedFiles = {
  'toast.tsx': 'components',
  'secure-prompt.tsx': 'components',
  'settings-button.tsx': 'components',
  'controls.tsx': 'components',
  'loading-overlay.tsx': 'components',
  'dockview-memo.tsx': 'components',
  'markdown-editor.tsx': 'components',
  'loading-overlay-store.ts': 'store',
  'visual-toggle-store.ts': 'store',
  'auto-lock-store.ts': 'store',
  'settings-context.tsx': 'context',
  'default.ts': 'constants',
};

// Create a mapping from the original absolute path (without extension) to the new alias
const originalToAlias = {};
for (const [file, folder] of Object.entries(movedFiles)) {
  const name = path.parse(file).name;
  const originalAbs = path.join(appDir, name);
  const alias = `@/app/${folder}/${name}`;
  originalToAlias[originalAbs.toLowerCase()] = alias;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let originalContent = content;

      let originalDir = path.dirname(fullPath);
      const baseName = path.basename(fullPath);
      if (movedFiles[baseName]) {
        if (dir === path.join(appDir, movedFiles[baseName])) {
           originalDir = appDir;
        }
      }

      content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
        let absoluteImportPath = path.resolve(originalDir, p1);
        absoluteImportPath = absoluteImportPath.replace(/\.tsx?$/, '');

        if (originalToAlias[absoluteImportPath.toLowerCase()]) {
          return `from "${originalToAlias[absoluteImportPath.toLowerCase()]}"`;
        }

        if (originalDir === appDir && dir !== appDir) {
           if (absoluteImportPath.toLowerCase().startsWith(appDir.toLowerCase())) {
              let relToApp = path.relative(appDir, absoluteImportPath);
              relToApp = relToApp.replace(/\\/g, '/');
              return `from "@/app/${relToApp}"`;
           }
        }

        return match;
      });

      content = content.replace(/import\(['"](\.[^'"]+)['"]\)/g, (match, p1) => {
        let absoluteImportPath = path.resolve(originalDir, p1);
        absoluteImportPath = absoluteImportPath.replace(/\.tsx?$/, '');
        
        if (originalToAlias[absoluteImportPath.toLowerCase()]) {
          return `import("${originalToAlias[absoluteImportPath.toLowerCase()]}")`;
        }
        
        if (originalDir === appDir && dir !== appDir) {
           if (absoluteImportPath.toLowerCase().startsWith(appDir.toLowerCase())) {
              let relToApp = path.relative(appDir, absoluteImportPath);
              relToApp = relToApp.replace(/\\/g, '/');
              return `import("@/app/${relToApp}")`;
           }
        }
        
        return match;
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDirectory('d:\\github\\my-secret-memo\\app');

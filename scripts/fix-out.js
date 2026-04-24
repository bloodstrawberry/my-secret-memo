const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../out');

function fixNextFolders(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (item.startsWith('_')) {
      const newItemName = item.replace(/^_+/, '');
      const newItemPath = path.join(dir, newItemName);

      if (stat.isDirectory()) {
        if (fs.existsSync(newItemPath)) {
          const subItems = fs.readdirSync(itemPath);
          subItems.forEach(subItem => {
            fs.renameSync(path.join(itemPath, subItem), path.join(newItemPath, subItem));
          });
          fs.rmdirSync(itemPath);
        } else {
          fs.renameSync(itemPath, newItemPath);
        }
        // Recursively check the renamed (or merged) folder
        fixNextFolders(newItemPath);
      } else {
        // It's a file
        fs.renameSync(itemPath, newItemPath);
      }
    } else if (stat.isDirectory()) {
      fixNextFolders(itemPath);
    }

    // String replacement in files (only for relevant extensions)
    const currentPath = item.startsWith('_') ? path.join(dir, item.replace(/^_+/, '')) : itemPath;
    if (fs.existsSync(currentPath) && !fs.statSync(currentPath).isDirectory()) {
      if (currentPath.endsWith('.html') || currentPath.endsWith('.js') || currentPath.endsWith('.json') || currentPath.endsWith('.txt')) {
        let content = fs.readFileSync(currentPath, 'utf8');
        const originalContent = content;
        
        // Comprehensive replacement: replace all /_something with /something
        // and _something with something in relevant patterns
        content = content.replace(/\/_next\//g, '/next/').replace(/_next\//g, 'next/');
        
        if (content !== originalContent) {
          fs.writeFileSync(currentPath, content, 'utf8');
        }
      }
    }
  });
}

if (fs.existsSync(outDir)) {
  console.log('Fixing Next.js output for Chrome Extension...');
  fixNextFolders(outDir);
  console.log('Done! All "_" prefixed folders have been renamed.');
} else {
  console.error('Error: "out" directory not found. Run "npm run build" first.');
}

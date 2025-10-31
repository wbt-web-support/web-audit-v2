# Scripts

## remove-console-logs.js

Removes all `console.log` statements from your project while preserving `console.error`, `console.warn`, `console.info`, `console.debug`, and `console.trace`.

### Features

- ✅ Removes all `console.log` statements
- ✅ Preserves `console.error`, `console.warn`, `console.info`, `console.debug`, `console.trace`
- ✅ Handles multiline statements
- ✅ Handles nested parentheses and strings correctly
- ✅ Supports dry-run mode to preview changes
- ✅ Automatically excludes `node_modules`, `.next`, `.git`, etc.

### Usage

**Dry Run (Preview Changes):**
```bash
npm run remove-console-logs:dry-run
```

**Apply Changes:**
```bash
npm run remove-console-logs
```

**Custom Path:**
```bash
node scripts/remove-console-logs.js --path ./src
```

**Direct Usage:**
```bash
node scripts/remove-console-logs.js [--dry-run] [--path <directory>]
```

### What Gets Processed

- **File Types**: `.ts`, `.tsx`, `.js`, `.jsx`
- **Excluded Directories**: `node_modules`, `.next`, `.git`, `dist`, `build`, `.cache`

### Example

**Before:**
```javascript
console.log('Debug message');
console.error('Error message');
console.log('Another debug');
```

**After:**
```javascript
console.error('Error message');
```


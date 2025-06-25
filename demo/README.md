# DOM Manipulation Demo

This demo shows how jsdom, diff-dom, and morphdom work with HTML documents.

## Setup

```bash
cd demo
npm install
```

## Run Demos

Individual demos:
```bash
npm run demo:jsdom      # Basic jsdom usage
npm run demo:diff-dom   # diff-dom diffing and patching
npm run demo:morphdom   # morphdom direct morphing
```

Run all demos:
```bash
npm run demo:all
```

Or run the comparison:
```bash
node comparison-demo.js
```

## What Each Library Does

- **jsdom**: Creates a full DOM implementation in Node.js
- **diff-dom**: Computes differences between DOM trees and can apply/undo changes
- **morphdom**: Efficiently morphs one DOM tree into another with minimal changes
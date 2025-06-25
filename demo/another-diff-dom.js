// another-diff-dom.js

// --- A NEW, MORE RELIABLE APPROACH ---
// We will convert HTML to a JSON tree (HAST), diff the JSON, then convert back.

// 1. Import the necessary tools
import { fromHtml } from 'hast-util-from-html'; // Parses HTML to a JSON tree
import { toHtml } from 'hast-util-to-html';     // Renders the JSON tree back to HTML
import { create as createJsonDiffPatcher } from 'jsondiffpatch'; // A powerful JSON diff/patch tool

// --- Your HTML strings ---
const html1 = `
  <h1>Hello World</h1>
  <p class="message">This is the original message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`;

const html2 = `
  <h1>Hello Universe</h1>
  <p class="message warning">This is the updated message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <button>Click me</button>
`;

// --- The New Workflow ---

// Step A: Convert both HTML strings into a structured JSON format (HAST).
// The { fragment: true } option is essential for handling snippets of HTML.
const tree1 = fromHtml(html1.trim(), { fragment: true });
const tree2 = fromHtml(html2.trim(), { fragment: true });

// Step B: Create a diff of the two JSON trees.
const jsondiffpatcher = createJsonDiffPatcher();
// The 'delta' object is the diff. It's inherently serializable.
const delta = jsondiffpatcher.diff(tree1, tree2);

// Step C: Serialize the diff.
const serializedDiff = JSON.stringify(delta, null, 2);
console.log('--- Serialized Diff (JSON Delta) ---');
console.log(serializedDiff);
// Note: If the diff is undefined, it means there are no changes.
if (!delta) {
    console.log("No differences found.");
} else {
    // Step D: Deserialize the diff
    const deserializedDiff = JSON.parse(serializedDiff);

    // Step E: Apply the patch to the first tree.
    // Note: jsondiffpatcher.patch modifies the tree in place.
    jsondiffpatcher.patch(tree1, deserializedDiff);

    // Step F: Convert the patched tree back into an HTML string
    const patchedHtml = toHtml(tree1);

    console.log('\n--- Patched HTML ---');
    console.log(patchedHtml);

    // Step G: Verification
    console.log('\n--- Verification ---');
    // For a reliable check, we'll convert html2 to its final rendered form too
    const finalHtml = toHtml(tree2);
    console.log('Patch applied successfully:', patchedHtml === finalHtml);
}
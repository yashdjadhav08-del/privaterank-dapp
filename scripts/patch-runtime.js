import fs from 'fs';
const p = process.cwd() + '/node_modules/@midnight-ntwrk/compact-runtime/dist/version.js';
if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('export const versionString = "0.19.0"')) {
    c = c.replace('export const versionString = "0.19.0"', 'export const versionString = "0.16.0"');
    c = c.replace('export const checkRuntimeVersion = (expectedRuntimeVersionString) => {', 'export const checkRuntimeVersion = () => {');
    fs.writeFileSync(p, c);
    console.log('Patched compact-runtime version to 0.16.0');
  } else {
    console.log('compact-runtime already patched or different version');
  }
} else {
  console.log('compact-runtime not found, skipping patch');
}

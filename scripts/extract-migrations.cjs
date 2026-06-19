// Extract and apply migration statements to production D1
const fs = require("fs");
const content = fs.readFileSync("packages/db/src/migrate.ts", "utf8");

// Extract all backtick-quoted CREATE TABLE / CREATE INDEX statements
const regex = /\x60((?:CREATE|INSERT|ALTER)[^;]+;)\x60/g;
const statements = [];
let match;
while ((match = regex.exec(content)) !== null) {
  statements.push(match[1]);
}

// Write to a temp SQL file
const sql = statements.join("\n");
fs.writeFileSync("migration.sql", sql);
console.log(`Extracted ${statements.length} statements to migration.sql`);

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\abbas\\Desktop\\iris new manager app\\supabase_schema.json', 'utf8'));

const definitions = data.definitions;
for (const [tableName, tableDef] of Object.entries(definitions)) {
  console.log(`\nTable: ${tableName}`);
  if (tableDef.properties) {
    for (const [colName, colDef] of Object.entries(tableDef.properties)) {
      console.log(`  - ${colName}: ${colDef.type} ${colDef.format || ''}`);
    }
  }
}

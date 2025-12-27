import fs from 'fs/promises';
import path from 'path';
import { createConnection, closeConnection } from '../database/connection';

async function migrate() {
  try {
    console.log('Starting database migration...');
    const connection = await createConnection();

    const schemaPath = path.join(__dirname, '../database/migrations/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf-8');

    // Split statements by semicolon and execute them one by one
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await connection.query(statement);
    }

    console.log('Migration completed successfully.');
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

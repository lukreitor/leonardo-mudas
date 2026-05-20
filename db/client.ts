import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const sqlite = openDatabaseSync('leonardo-mudas.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });
export { schema };

export type Database = typeof db;

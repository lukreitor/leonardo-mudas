import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import { db } from './client';

export function useDbMigrations() {
  return useMigrations(db, migrations);
}

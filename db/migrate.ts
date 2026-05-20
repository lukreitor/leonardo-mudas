import { useEffect, useState } from 'react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import { db } from './client';
import { backupService } from '../services/backup';

export function useDbMigrations() {
  const baseResult = useMigrations(db, migrations);
  const [snapshotted, setSnapshotted] = useState(false);

  useEffect(() => {
    if (!snapshotted) {
      backupService.snapshotBeforeMigration().finally(() => setSnapshotted(true));
    }
  }, [snapshotted]);

  return baseResult;
}

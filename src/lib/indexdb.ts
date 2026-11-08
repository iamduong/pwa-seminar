import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";

import type { PoiBundle, PublicPoi } from "../types/Poi";

export type DBPoi = PoiBundle & {
  lang: string;
};

interface Quan4DatabaseSchema extends DBSchema {
  db_poi: {
    key: string;
    value: DBPoi;
  };
}

const DB_NAME = "Quan4DB";
const DB_VERSION = 1;
const POI_STORE = "db_poi";

let databasePromise: Promise<IDBPDatabase<Quan4DatabaseSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<Quan4DatabaseSchema>> {
  if (!databasePromise) {
    databasePromise = openDB<Quan4DatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(POI_STORE)) {
          database.createObjectStore(POI_STORE, { keyPath: "lang" });
        }
      },
    });
  }

  return databasePromise;
}

export async function getCachedPoi(lang: string): Promise<DBPoi | undefined> {
  const database = await getDatabase();
  return database.get(POI_STORE, lang);
}

export async function savePoi(
  lang: string,
  data: PoiBundle,
  replace = false,
): Promise<DBPoi> {
  const database = await getDatabase();
  const transaction = database.transaction(POI_STORE, "readwrite");
  const cached = await transaction.store.get(lang);
  const poisById = new Map<string, PublicPoi>();

  if (!replace) {
    cached?.pois.forEach((poi) => poisById.set(poi.id, poi));
  }
  data.pois.forEach((poi) => poisById.set(poi.id, poi));

  const record: DBPoi = {
    lang,
    etag: data.etag,
    updated_after: data.updated_after,
    pois: Array.from(poisById.values()),
  };

  await transaction.store.put(record);
  await transaction.done;

  return record;
}

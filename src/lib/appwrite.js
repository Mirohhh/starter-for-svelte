import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
  PUBLIC_APPWRITE_DATABASE_ID,
  PUBLIC_APPWRITE_TABLE_ID,
} from "$env/static/public";

import { Client, Account, TablesDB, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
  .setProject(PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const tablesDB = new TablesDB(client);

const DB_ID = PUBLIC_APPWRITE_DATABASE_ID;
const TABLE_ID = PUBLIC_APPWRITE_TABLE_ID;

export async function listTasks() {
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: TABLE_ID,
    queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
  });
  return res.rows;
}

/**
 * @param {Record<string, unknown>} data
 */
export async function createTask(data) {
  return tablesDB.createRow({
    databaseId: DB_ID,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data,
  });
}

/**
 * @param {string} documentId
 * @param {Record<string, unknown>} data
 */
export async function updateTask(documentId, data) {
  return tablesDB.updateRow({
    databaseId: DB_ID,
    tableId: TABLE_ID,
    rowId: documentId,
    data,
  });
}

/**
 * @param {string} documentId
 */
export async function deleteTask(documentId) {
  return tablesDB.deleteRow({
    databaseId: DB_ID,
    tableId: TABLE_ID,
    rowId: documentId,
  });
}

export { client, account, tablesDB, ID, Query };

import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
  PUBLIC_APPWRITE_DATABASE_ID,
  PUBLIC_APPWRITE_COLLECTION_ID,
} from "$env/static/public";

import { Client, Account, Databases, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
  .setProject(PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = PUBLIC_APPWRITE_DATABASE_ID;
const COL_ID = PUBLIC_APPWRITE_COLLECTION_ID;

export async function listTasks() {
  const res = await databases.listDocuments(DB_ID, COL_ID, [
    Query.orderDesc("created_at"),
    Query.limit(100),
  ]);
  return res.documents;
}

/**
 * @param {Record<string, unknown>} data
 */
export async function createTask(data) {
  return databases.createDocument(DB_ID, COL_ID, ID.unique(), data);
}

/**
 * @param {string} documentId
 * @param {Record<string, unknown>} data
 */
export async function updateTask(documentId, data) {
  return databases.updateDocument(DB_ID, COL_ID, documentId, data);
}

/**
 * @param {string} documentId
 */
export async function deleteTask(documentId) {
  return databases.deleteDocument(DB_ID, COL_ID, documentId);
}

export { client, account, databases, ID, Query };

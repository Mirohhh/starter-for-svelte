import {
  env as publicEnv,
} from "$env/dynamic/public";
import { Client, Account, Databases } from "appwrite";

const APPWRITE_ENDPOINT =
  publicEnv.PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID =
  publicEnv.PUBLIC_APPWRITE_PROJECT_ID ?? "69ca18620021dca898da";
const APPWRITE_PROJECT_NAME =
  publicEnv.PUBLIC_APPWRITE_PROJECT_NAME ?? "Appwrite Project";

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

export {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_PROJECT_NAME,
  client,
  account,
  databases,
};

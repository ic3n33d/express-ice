import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// 1. Force the file to read your local .env variables
dotenv.config();

export default defineConfig({
  // @ts-ignore
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
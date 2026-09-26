import app from './app.js';
import { checkAndInitTables } from './db/initDb.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  await checkAndInitTables();
});

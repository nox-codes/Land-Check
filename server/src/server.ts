import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { closeBrowser } from './scraper/browser';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function start() {
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/graphql' });

  // GraphQL middleware attached after Apollo starts — see Task 11
  try {
    const { setupGraphQL } = await import('./graphql');
    const graphqlMiddleware = await setupGraphQL(httpServer, wss);
    app.use('/graphql', graphqlMiddleware);
  } catch {
    console.warn('GraphQL module not yet available — skipping GraphQL setup (Task 11)');
  }

  // Start scraper cron job
  try {
    const { startScraperCron } = await import('./scraper/cron');
    await startScraperCron();
  } catch {
    console.warn('Scraper module not yet available — skipping cron setup');
  }

  const shutdown = async () => {
    await closeBrowser();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions: ws://localhost:${PORT}/graphql`);
  });
}

start().catch(console.error);

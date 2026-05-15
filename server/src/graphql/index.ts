import { ApolloServer, HeaderMap } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { useServer } from 'graphql-ws/use/ws';
import type http from 'http';
import type { WebSocketServer } from 'ws';
import type { Request, Response } from 'express';
import { parse as parseUrl } from 'url';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { buildContext } from './context';

interface GraphQLContext {
  user: { id: string; email: string; role: string } | undefined;
}

export async function setupGraphQL(httpServer: http.Server, wss: WebSocketServer) {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // graphql-ws subscription server on existing wss
  const wsServer = useServer(
    {
      schema,
      context: async (ctx) => buildContext({ connectionParams: ctx.connectionParams as Record<string, unknown> }),
    },
    wss,
  );

  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsServer.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // Return Express middleware that bridges Apollo Server v5 with Express
  return async (req: Request, res: Response) => {
    const headers = new HeaderMap();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const httpGraphQLRequest = {
      method: req.method!.toUpperCase(),
      headers,
      search: parseUrl(req.url!).search ?? '',
      body: req.body,
    };

    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest,
      context: () => buildContext({ req }),
    });

    for (const [key, value] of httpGraphQLResponse.headers) {
      res.setHeader(key, value);
    }

    res.statusCode = httpGraphQLResponse.status || 200;

    if (httpGraphQLResponse.body.kind === 'complete') {
      res.end(httpGraphQLResponse.body.string);
      return;
    }

    for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
      res.write(chunk);
    }
    res.end();
  };
}

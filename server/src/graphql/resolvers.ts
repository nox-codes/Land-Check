import { GraphQLError } from 'graphql';
import { prisma } from '../lib/prisma';
import { pubsub } from './pubsub';
import type { GraphQLContext } from './context';

type Context = GraphQLContext;

export const resolvers = {
  Query: {
    verification: async (_parent: unknown, args: { id: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const verification = await prisma.landVerification.findUnique({ where: { id: args.id } });
      if (!verification) {
        throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND' } });
      }

      if (context.user.role !== 'ADMIN' && verification.userId !== context.user.id) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
      }

      return verification;
    },

    verifications: async (_parent: unknown, _args: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const where = context.user.role === 'ADMIN' ? {} : { userId: context.user.id };
      return prisma.landVerification.findMany({ where, orderBy: { createdAt: 'desc' } });
    },

    reports: async (_parent: unknown, _args: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      if (context.user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
      }

      const reports = await prisma.scamReport.findMany({ orderBy: { createdAt: 'desc' } });
      return reports.map((r) => ({
        ...r,
        evidenceUrls: Array.isArray(r.evidenceUrls) ? r.evidenceUrls : [],
      }));
    },
  },

  Mutation: {
    // Anonymous reports are intentional — matches REST behaviour; userId is nullable in DB
    createReport: async (
      _parent: unknown,
      args: { parcelNumber: string; description: string; evidenceUrls?: string[] },
      context: Context,
    ) => {
      const report = await prisma.scamReport.create({
        data: {
          userId: context.user?.id,
          parcelNumber: args.parcelNumber,
          description: args.description,
          evidenceUrls: args.evidenceUrls ?? [],
        },
      });

      return {
        ...report,
        evidenceUrls: Array.isArray(report.evidenceUrls) ? report.evidenceUrls : [],
      };
    },
  },

  Subscription: {
    verificationUpdated: {
      subscribe: (_parent: unknown, args: { id: string }, context: Context) => {
        if (!context.user) {
          throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHENTICATED' } });
        }
        return pubsub.asyncIterableIterator([`VERIFICATION_UPDATED_${args.id}`]);
      },
    },
  },
};

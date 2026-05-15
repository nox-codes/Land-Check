import { prisma } from '../../lib/prisma';

export async function createReport(data: { userId?: string; parcelNumber: string; description: string; evidenceUrls?: string[] }) {
  return prisma.scamReport.create({ data: { userId: data.userId, parcelNumber: data.parcelNumber, description: data.description, evidenceUrls: data.evidenceUrls ?? [] } });
}

export async function getAllReports() {
  return prisma.scamReport.findMany({ orderBy: { createdAt: 'desc' } });
}

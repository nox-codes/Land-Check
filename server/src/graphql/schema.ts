export const typeDefs = `#graphql
  scalar JSON

  type Verification {
    id: ID!
    parcelNumber: String!
    location: String!
    ownerName: String!
    status: String!
    trustScore: Int
    createdAt: String!
    updatedAt: String!
  }

  type Document {
    id: ID!
    verificationId: ID!
    filename: String!
    mimeType: String!
    storagePath: String!
    aiAnalysis: JSON
    createdAt: String!
  }

  type Payment {
    id: ID!
    verificationId: ID!
    amount: Float!
    status: String!
    squadReference: String
    createdAt: String!
  }

  type Report {
    id: ID!
    parcelNumber: String!
    description: String!
    evidenceUrls: [String!]!
    createdAt: String!
  }

  type Query {
    verification(id: ID!): Verification
    verifications: [Verification!]!
    reports: [Report!]!
  }

  type Mutation {
    createReport(parcelNumber: String!, description: String!, evidenceUrls: [String!]): Report!
  }

  type Subscription {
    verificationUpdated(id: ID!): Verification!
  }
`;

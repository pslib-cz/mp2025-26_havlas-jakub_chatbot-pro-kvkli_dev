import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Conversation {
    conversationId: ID!
    length: Int!
    userFeedback: Boolean
    userFeedbackMessage: String
    prompts: [Prompt!]!
  }

  type Prompt {
    promptId: ID!
    promptText: String!
    answerText: String!
    userFeedback: Boolean
    conversationId: Int!
    conversation: Conversation
  }

  type Query {
    conversations: [Conversation!]!
    conversation(id: ID!): Conversation
    prompts: [Prompt!]!
    prompt(id: ID!): Prompt
  }

  type Mutation {
    createConversation(length: Int!): Conversation!
    addPrompt(
      conversationId: Int!
      promptText: String!
      answerText: String!
    ): Prompt!
  }
`;

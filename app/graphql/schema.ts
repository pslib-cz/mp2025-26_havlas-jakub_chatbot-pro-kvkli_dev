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
  }

  type Mutation {
    addPrompt(promptText: String!, conversationId: Int): AddPromptResponse!
    addPromptFeedback(
      conversationId: Int!
      promptNth: Int!
      userFeedback: Boolean!
    ): Prompt!
    addConvoFeedback(
      conversationId: Int!
      userFeedbackMessage: String
      userFeedback: Boolean
    ): Conversation!
  }

  type AddPromptResponse {
    conversationId: Int!
    prompt: Prompt!
  }
`;

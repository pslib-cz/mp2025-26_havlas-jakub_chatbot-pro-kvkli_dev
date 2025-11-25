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
     deletePrompt(id: ID!): Int!
  }

  type AddPromptResponse {
    conversationId: Int!
    prompt: Prompt!
  }
`;

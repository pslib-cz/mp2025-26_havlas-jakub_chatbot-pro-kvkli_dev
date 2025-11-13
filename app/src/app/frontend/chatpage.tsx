import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import {  useMutation } from "@apollo/client/react";
import { useState } from "react";

// 1️⃣ Define the mutation
const ADD_PROMPT = gql`
  mutation AddPrompt($promptText: String!, $conversationId: Int) {
    addPrompt(promptText: $promptText, conversationId: $conversationId) {
      conversationId
      prompt {
        promptId
        promptText
        answerText
        userFeedback
        conversationId
      }
    }
  }
`;


// 3️⃣ React component
export default function AddPromptButton() {
  const [addPrompt, { data, loading, error }] = useMutation(ADD_PROMPT);
    const [promptText, setPromptText] = useState("");

  const handleClick = () => {
    addPrompt({
      variables: {
        promptText: "What is 2 + 2?",
        conversationId: 1,
      },
    });
  };

  return (
    
    <>
    fr
       <input
        
          placeholder="Type a message..."
        />
      <button onClick={handleClick} disabled={loading}>
        Add Prompt
      </button>

    </>

 
 
  );
}

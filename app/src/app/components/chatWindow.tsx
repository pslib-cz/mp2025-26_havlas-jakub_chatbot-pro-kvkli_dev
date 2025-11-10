"use client";
import { useState } from "react";
import {  gql } from "@apollo/client";
import {  useMutation } from "@apollo/client/react";

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
type addPromptData ={
  addPrompt: {
    conversationId: number;
    prompt: {
      promptId: number;
      promptText: string;
      answerText: string;
    }
  };
}
export default function ChatWindow() {
   const [addPromptMutation, { data, loading, error }] = useMutation<addPromptData, { promptText: string; conversationId?: number | null }>(ADD_PROMPT);
   const [conversationId, setConversationId] = useState<number | null>(null);
 const [input, setInput] = useState("");
const [messages, setMessages] = useState<string[]>([]);
const [answers, setAnswers] = useState<string[]>([]);


const handleClick = async () => {
  setMessages([...messages, input]);

  try {
    const { data: addPromptResponse } = await addPromptMutation({
      variables: {
        promptText: input,
        conversationId: conversationId,
      },
    });

    if (addPromptResponse?.addPrompt.conversationId) {
      setConversationId(addPromptResponse.addPrompt.conversationId);
    }

    setAnswers([...answers, addPromptResponse?.addPrompt.prompt.answerText || ""]);
  } catch (err) {
    console.error("Error adding prompt:", err);
  }

  setInput("");
};

  return (
  <>
 

      <div>
        <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <div>
        {answers.map((ans, index) => (
          <div key={index}>{ans}</div>
        ))}
      </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
          <button onClick={handleClick}>
            Add Prompt
          </button>
      </div>
  </>
  );
}


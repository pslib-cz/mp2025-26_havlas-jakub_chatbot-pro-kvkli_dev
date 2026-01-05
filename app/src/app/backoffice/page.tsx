"use client";

import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import CrawlPanel from "./crawlButton";
const GET_PROMPTS = gql`
  query GetPrompts {
    prompts {
      conversationId
      promptId
      promptText
      answerText
      userFeedback
    }
  }
`;

const DELETE_PROMPT = gql`
  mutation DeletePrompt($id: ID!) {
    deletePrompt(id: $id)
  }
`;

type Prompt = {
  promptId: number;
  conversationId: number;
  promptText: string;
  answerText: string;
  userFeedback: boolean | null;
};

export default function PromptsPage() {
  const { loading, error, data } = useQuery<{ prompts: Prompt[] }>(GET_PROMPTS);
  const [deletePrompt] = useMutation<{ deletePrompt: number }, { id: number }>(DELETE_PROMPT);

  const handleDelete = async (promptId: number) => {
    try {
      await deletePrompt({ variables: { id: promptId } });
      alert(`Prompt ${promptId} deleted successfully.`);
    } catch (err) {
      console.error("Error deleting prompt:", err);
      alert(`Failed to delete prompt ${promptId}.`);
    }
  };

  if (loading) return <p className="p-4 text-gray-500 dark:text-gray-400">Loading...</p>;
  if (error) return <p className="p-4 text-red-500 dark:text-red-400">Error loading prompts</p>;

  // Prepare data for the pie chart
  const feedbackCounts = data?.prompts.reduce(
    (acc, prompt) => {
      if (prompt.userFeedback === true) acc.true += 1;
      else if (prompt.userFeedback === false) acc.false += 1;
      else acc.null += 1;
      return acc;
    },
    { true: 0, false: 0, null: 0 }
  );

  const pieData = [
    { name: "👍 True", value: feedbackCounts?.true || 0, color: "#16a34a" }, // green
    { name: "👎 False", value: feedbackCounts?.false || 0, color: "#dc2626" }, // red
    { name: "❓ Null", value: feedbackCounts?.null || 0, color: "#6b7280" }, // gray
  ];

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">All Prompts</h1>
      <CrawlPanel />
      {/* Pie chart */}
      <div className="mb-8 flex justify-center">
        <PieChart width={300} height={300}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) => `${name}: ${value}`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Conversation</th>
              <th className="py-2 px-4 border-b">Prompt Text</th>
              <th className="py-2 px-4 border-b">Answer Text</th>
              <th className="py-2 px-4 border-b">User Feedback</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-100">
            {data?.prompts.map((prompt) => (
              <tr
                key={prompt.promptId}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="py-2 px-4 border-b">{prompt.promptId}</td>
                <td className="py-2 px-4 border-b">{prompt.conversationId}</td>
                <td className="py-2 px-4 border-b">{prompt.promptText}</td>
                <td className="py-2 px-4 border-b">{prompt.answerText}</td>
                <td className="py-2 px-4 border-b">
                  {prompt.userFeedback === true
                    ? "👍"
                    : prompt.userFeedback === false
                    ? "👎"
                    : "❓"}
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleDelete(prompt.promptId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

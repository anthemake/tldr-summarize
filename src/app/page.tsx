"use client";

import { useState } from "react";
import WordLimitTextarea from "./components/WordLimitTextarea";
import Footer from "./components/Footer";

/**
 * Home component to display the main page of the summarization app.
 */
const Home = () => {
  // States to manage the text input, summaries, and app behavior
  const [text, setText] = useState(""); // Holds the text input from WordLimitTextarea
  const [summary, setSummary] = useState(""); // Stores the summarized text
  const [bulletPoints, setBulletPoints] = useState([]); // Stores the bullet point summary
  const [loading, setLoading] = useState(false); // Indicates if summarization is in progress
  const [activeTab, setActiveTab] = useState("summary"); // Manage which view tab is active (summary or bullet points)
  const [fadeIn, setFadeIn] = useState(false); // Manages fade-in effect for content

  /**
   * Handles the submission of the text to be summarized.
   *
   * @param e - Form event to prevent default behavior
   */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent API call if no text is provided
    if (!text) {
      alert("Please enter some text to summarize.");
      return;
    }

    try {
      // Indicate that the summarization process has started
      setLoading(true);
      setFadeIn(false); // Reset fade-in effect before loading

      // Make a POST request to the summarization API
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }), // Sending the text to be summarized
      });

      const data = await response.json();

      // Update state based on response from API
      if (response.ok) {
        setSummary(data.summary);
        setBulletPoints(data.bulletPoints);
        setTimeout(() => setFadeIn(true), 100); // Apply fade-in effect to summary
      } else {
        console.error("Failed to get summary:", data.error);
        alert(data.error); // Display error message to user
      }
    } catch (error) {
      // Log any unexpected errors that may occur
      console.error("Error submitting form:", error);
      alert("An unexpected error occurred.");
    } finally {
      // Ensure the loading state is reset regardless of the result
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col">
      {/* Main header */}
      <h1 className="text-3xl font-bold mb-4 text-indigo-400">
        TLDR Summarizer
      </h1>

      {/* Form for text input and submission */}
      <form onSubmit={handleSubmit} className="mb-6">
        {/* Word-limited textarea component for user input */}
        <WordLimitTextarea setText={setText} />

        {/* Submit button to trigger summarization */}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
          disabled={loading} // Disable button when loading
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </form>

      {/* Tab Navigation for switching between summary and bullet point views */}
      <div className="flex space-x-4 mb-4">
        {/* Summary view button */}
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "summary" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Summary View
        </button>
        {/* Bullet point view button */}
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "bullet" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("bullet")}
        >
          Bullet Point View
        </button>
      </div>

      {/* Conditional rendering for tab content with fade-in effect */}
      <div
        className={`tab-content transition-all duration-500 ease-in-out transform ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Summary view content */}
        {activeTab === "summary" && summary && (
          <div className="bg-[#f9fbff] shadow-[2px_5px_14px_#eceaff] rounded-lg p-4 mb-4">
            <h2 className="text-xl font-bold mb-2 text-indigo-400">Summary:</h2>
            <p className="text-[30px]">{summary}</p>
          </div>
        )}

        {/* Bullet point view content */}
        {activeTab === "bullet" && bulletPoints.length > 0 && (
          <div className="bg-[#f9fbff] shadow-[2px_5px_14px_#eceaff] rounded-lg p-4 mb-4">
            <h2 className="text-xl font-bold mb-2 text-indigo-400">
              Bullet Point Summary:
            </h2>
            <ul className="list-disc pl-5 text-[30px]">
              {/* Map each bullet point to a list item */}
              {bulletPoints.map((point, index) => (
                <li
                  className="py-3 underline decoration-indigo-300"
                  key={index}
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer component at the bottom */}
      <Footer />
    </div>
  );
};

export default Home;

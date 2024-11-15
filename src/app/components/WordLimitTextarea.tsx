import { useState } from "react";

interface WordLimitTextareaProps {
  setText: (text: string) => void; // Function to set the text from the parent
}

const WordLimitTextarea: React.FC<WordLimitTextareaProps> = ({ setText }) => {
  const [currentText, setCurrentText] = useState<string>(""); // State to store the text input
  const maxWords = 500;

  /**
   * Handle the text change in the textarea.
   * Limits the word count to `maxWords` and updates state.
   *
   * @param e - Change event from the textarea
   */

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const wordCount = text
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    // Update text count if within word limit
    if (wordCount <= maxWords) {
      setCurrentText(text);
      setText(text);
    }
  };

  return (
    <div className="bg-[#f9fbff] shadow-[2px_5px_14px_#eceaff] rounded-lg p-4 mb-4">
      <textarea
        value={currentText}
        onChange={handleTextChange}
        placeholder="Enter up to 500 words (3000 characters) to summarize"
        className="w-full p-2 border border-gray-300 rounded-md text-base sm:text-sm lg:text-4xl"
      ></textarea>

      {/* Word count display */}
      <p className="font-bold text-lg text-gray-600">
        {
          currentText.split(/\s+/).filter((word: string) => word.length > 0)
            .length
        }{" "}
        / {maxWords} words
      </p>
    </div>
  );
};

export default WordLimitTextarea;

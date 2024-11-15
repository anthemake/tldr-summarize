"use client";
import { useState } from "react";
import Footer from "../components/Footer";
/**
 * PrivacyPolicy component allows users to delete their data from the application.
 */
export default function PrivacyPolicy() {
  const [message, setMessage] = useState(""); // State to display feedback messages to the user

  /**
   * handleDeleteData function triggers a DELETE request to the backend endpoint
   * responsible for deleting user data. Sets the appropriate success or error message
   * based on the server response.
   */

  const handleDeleteData = async () => {
    try {
      // Send a DELETE request to the '/api/delete' endpoint
      const response = await fetch("/api/delete", {
        method: "DELETE",
      });

      // Parse the response from the server
      const result = await response.json();

      // If the deletion is successful, display a success message
      if (response.ok) {
        setMessage("Your data has been deleted successfully.");
      } else {
        // Display any error message returned by the server or a generic error message
        setMessage(
          result.error || "An error occurred while deleting your data."
        );
      }
    } catch (error) {
      // Log error for debugging and display a generic error message to the user
      console.error("Error:", error);
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p>
        We collect and process the following personal data: IP addresses, which
        are stored in a hashed format. We collect this data to protect our
        service from abuse by implementing rate limiting mechanisms. No other
        personal data is collected or stored by our service.
      </p>
      <p>
        Your data is only retained for a short period of time (e.g., 24 hours),
        after which it is automatically deleted. You have the right to request
        deletion of any personal data we have collected by contacting us at
        privacy@anthemake.com.
      </p>

      <h2 className="text-xl font-bold mt-6">Your Rights</h2>
      <p>
        If you would like to request access to your data or request that your
        data be deleted, please contact us at privacy@anthemake.com.
      </p>
      <button
        className=" rounded text-white bg-sky-500 w-32 p-2 my-10"
        onClick={handleDeleteData}
      >
        Delete My Data
      </button>
      {message && <p>{message}</p>}
      <Footer />
    </div>
  );
}

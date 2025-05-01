import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Lock, Mail, UserPlus, LogIn, Key } from "lucide-react";

/**
 * @constant {string} VALID_INVITATION_CODE
 * Defines the required invitation code for user registration.
 */
const VALID_INVITATION_CODE = import.meta.env.VITE_INVITATION_CODE;

/**
 * Renders the Login and Registration page component.
 * Handles user input, authentication state (login/signup), error display,
 * and interaction with the authentication context.
 *
 * @returns {JSX.Element} The rendered login/registration page.
 */
const LoginPage = () => {
  // ==========================================================================
  // State Variables
  // ==========================================================================

  const [activeTab, setActiveTab] = useState("login"); // Controls visibility of 'login' or 'register' form
  const [email, setEmail] = useState(""); // Stores the user's email input
  const [password, setPassword] = useState(""); // Stores the user's password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Stores the password confirmation input (for registration)
  const [invitationCode, setInvitationCode] = useState(""); // Stores the invitation code input (for registration)
  const [error, setError] = useState(""); // Stores any authentication or validation error messages
  const [loading, setLoading] = useState(false); // Indicates if an authentication request is in progress

  // ==========================================================================
  // Hooks
  // ==========================================================================

  /**
   * Access authentication functions (login, signup) from the AuthContext.
   */
  const { login, signup } = useAuth();

  // ==========================================================================
  // Handler Functions
  // ==========================================================================

  /**
   * Switches the active form tab between 'login' and 'register'.
   * Clears any existing error messages when switching.
   * @param {'login' | 'register'} tab - The tab to switch to.
   */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(""); // Clear errors on tab switch for better UX
  };

  /**
   * Handles the login form submission.
   * Prevents multiple submissions, sets loading state, calls the login function
   * from AuthContext, and handles potential errors.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (loading) return; // Avoid concurrent requests

    setError(""); // Clear previous errors
    setLoading(true); // Indicate processing started

    try {
      await login(email, password);
      // On successful login, the AuthProvider handles redirection or state update.
    } catch (err) {
      console.error("Login failed:", err); // Log error for debugging
      setError(
        `Sikertelen bejelentkezés: ${
          err.message || "Ismeretlen hiba történt."
        }`,
      );
    } finally {
      setLoading(false); // Indicate processing finished
    }
  };

  /**
   * Handles the registration form submission.
   * Performs validation (password match, length, invitation code), prevents
   * multiple submissions, sets loading state, calls the signup function
   * from AuthContext, and handles potential errors.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (loading) return; // Avoid concurrent requests

    setError(""); // Clear previous errors

    // --- Input Validation ---
    if (password !== confirmPassword) {
      setError("A két jelszó nem egyezik!");
      return; // Stop submission if passwords don't match
    }
    if (password.length < 6) {
      // Basic password length check (Firebase enforces this too)
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return; // Stop submission if password is too short
    }
    if (invitationCode.trim() !== VALID_INVITATION_CODE) {
      setError("Érvénytelen meghívó kód!");
      return; // Stop submission if invitation code is incorrect
    }
    // --- End Validation ---

    setLoading(true); // Indicate processing started

    try {
      await signup(email, password);
      // On successful signup, the AuthProvider handles redirection or state update.
    } catch (err) {
      console.error("Signup failed:", err);
      setError(
        `Sikertelen regisztráció: ${err.message || "Ismeretlen hiba történt."}`,
      );
    } finally {
      setLoading(false); // Indicate processing finished
    }
  };

  // ==========================================================================
  // Helper Components / Rendering Functions
  // ==========================================================================

  /**
   * Renders an input field component with a leading icon.
   *
   * @param {React.ElementType} IconComponent - The icon component (e.g., from lucide-react).
   * @param {string} id - The id and name attribute for the input.
   * @param {string} type - The input type (e.g., 'text', 'email', 'password').
   * @param {string} placeholder - The placeholder text for the input.
   * @param {string} value - The current value of the input state.
   * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange - The onChange event handler.
   * @param {boolean} [required=true] - Whether the input is required.
   * @returns {JSX.Element} A div containing the icon and the styled input field.
   */
  const renderInputWithIcon = (
    IconComponent,
    id,
    type,
    placeholder,
    value,
    onChange,
    required = true,
  ) => (
    <div className="relative mb-4">
      {/* Icon positioning container */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <IconComponent className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      {/* Input Field */}
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-blue-500" // Added focus ring
        placeholder={placeholder}
        required={required}
        // Improve browser autocomplete suggestions
        autoComplete={
          type === "password"
            ? id === "password"
              ? "current-password" // Hint for login password
              : "new-password" // Hint for registration passwords
            : type === "email"
              ? "email"
              : "off" // Default autocomplete 'off' for others if needed
        }
      />
    </div>
  );

  // ==========================================================================
  // Component Rendering
  // ==========================================================================

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100">
      {/* Main Content Card */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          BölcsiPlan
        </h2>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button" // Explicitly type buttons not submitting forms
            onClick={() => switchTab("login")}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm focus:outline-none transition-colors duration-200 ${
              activeTab === "login"
                ? "border-b-2 border-blue-600 text-blue-600" // Active state styles
                : "text-gray-500 hover:text-gray-700" // Inactive state styles
            }`}
          >
            Bejelentkezés
          </button>
          <button
            type="button" // Explicitly type buttons not submitting forms
            onClick={() => switchTab("register")}
            className={`flex-1 py-2 px-4 text-center font-medium text-sm focus:outline-none transition-colors duration-200 ${
              activeTab === "register"
                ? "border-b-2 border-green-600 text-green-600" // Active state styles
                : "text-gray-500 hover:text-gray-700" // Inactive state styles
            }`}
          >
            Regisztráció
          </button>
        </div>

        {/* Error Message Display Area */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
            role="alert" // Improve accessibility
          >
            {error}
          </div>
        )}

        {/* Conditional Rendering: Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} noValidate>
            {" "}
            {renderInputWithIcon(
              Mail, // Icon component
              "email", // Input ID and name
              "email", // Input type
              "Email cím", // Placeholder text
              email, // Bound state value
              (e) => setEmail(e.target.value), // State update handler
            )}
            {renderInputWithIcon(
              Lock, // Icon component
              "password", // Input ID and name
              "password", // Input type
              "Jelszó", // Placeholder text
              password, // Bound state value
              (e) => setPassword(e.target.value), // State update handler
            )}
            <button
              type="submit"
              disabled={loading} // Disable button while loading
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center justify-center transition-colors duration-200"
            >
              <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />{" "}
              {/* Button icon */}
              {loading ? "Bejelentkezés..." : "Bejelentkezés"}{" "}
              {/* Dynamic button text */}
            </button>
          </form>
        )}

        {/* Conditional Rendering: Registration Form */}
        {activeTab === "register" && (
          <form onSubmit={handleSignup} noValidate>
            {" "}
            {renderInputWithIcon(
              Mail, // Icon component
              "email", // Input ID and name
              "email", // Input type
              "Email cím", // Placeholder text
              email, // Bound state value
              (e) => setEmail(e.target.value), // State update handler
            )}
            {renderInputWithIcon(
              Lock, // Icon component
              "password", // Input ID and name
              "password", // Input type
              "Jelszó (min. 6 karakter)", // Placeholder text with hint
              password, // Bound state value
              (e) => setPassword(e.target.value), // State update handler
            )}
            {renderInputWithIcon(
              Lock, // Icon component
              "confirmPassword", // Input ID and name
              "password", // Input type
              "Jelszó megerősítése", // Placeholder text
              confirmPassword, // Bound state value
              (e) => setConfirmPassword(e.target.value), // State update handler
            )}
            {renderInputWithIcon(
              Key, // Icon component
              "invitationCode", // Input ID and name
              "text", // Input type
              "Meghívó kód", // Placeholder text
              invitationCode, // Bound state value
              (e) => setInvitationCode(e.target.value), // State update handler
            )}
            <button
              type="submit"
              disabled={loading} // Disable button while loading
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center justify-center transition-colors duration-200"
            >
              <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />{" "}
              {/* Button icon */}
              {loading ? "Regisztráció..." : "Regisztráció"}{" "}
              {/* Dynamic button text */}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

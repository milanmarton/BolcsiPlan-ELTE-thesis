import React from "react";
import { Settings, Printer, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Renders the application header.
 * Displays the application title, logged-in user information (if available),
 * and action buttons for settings, printing the schedule, and logging out.
 *
 * @param {object} props - The component props.
 * @param {object | null} props.user - The currently authenticated user object (should contain email). Null if no user is logged in.
 * @param {Function} props.onSettingsClick - Callback function to execute when the settings button is clicked.
 * @returns {JSX.Element} The rendered header component.
 */
const Header = ({ user, onSettingsClick }) => {
  // --- Hooks ---
  const { logout } = useAuth();

  // --- Event Handlers ---

  /**
   * Handles the logout process by calling the logout function from the AuthContext.
   * Logs an error to the console if the logout process fails.
   */
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  /**
   * Triggers the browser's native print dialog to print the current page.
   */
  const handlePrint = () => {
    window.print();
  };

  // --- Render Logic ---
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md print:hidden">
      {" "}
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* App Title */}
        <h1 className="text-xl sm:text-2xl font-bold mb-2 md:mb-0 text-center md:text-left">
          BölcsiPlan
        </h1>

        {/* User Info and Action Buttons */}
        <div className="flex flex-wrap items-center justify-center md:justify-end space-x-1 sm:space-x-2">
          {/* User Email Display */}
          {user && (
            <span className="flex items-center text-sm mr-2 sm:mr-4 mb-2 md:mb-0 order-first md:order-none">
              <User className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate" title={user.email}>
                {user.email}
              </span>{" "}
            </span>
          )}

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="flex items-center px-2 py-2 sm:px-3 bg-white text-blue-600 rounded hover:bg-blue-50 mb-2 md:mb-0"
            title="Beállítások"
            aria-label="Beállítások megnyitása"
          >
            <Settings className="w-4 h-4 sm:mr-1" aria-hidden="true" />{" "}
            <span className="hidden sm:inline">Beállítások</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center px-2 py-2 sm:px-3 bg-white text-blue-600 rounded hover:bg-blue-50 mb-2 md:mb-0"
            title="Nyomtatás"
            aria-label="Aktuális nézet nyomtatása"
          >
            <Printer className="w-4 h-4 sm:mr-1" aria-hidden="true" />
            <span className="hidden sm:inline">Nyomtatás</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center px-2 py-2 sm:px-3 bg-red-500 text-white rounded hover:bg-red-600 mb-2 md:mb-0"
            title="Kijelentkezés"
            aria-label="Kijelentkezés a fiókból"
          >
            <LogOut className="w-4 h-4 sm:mr-1" aria-hidden="true" />
            <span className="hidden sm:inline">Kijelentkezés</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

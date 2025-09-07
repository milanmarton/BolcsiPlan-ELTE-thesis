import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

/**
 * Generates a simple pseudo-unique identifier for new staff members.
 * @returns {string} A string in the format 'staff_timestamp_randomstring'.
 * @example
 * generateId() // returns something like "staff_1678886400000_a1b2c"
 */
const generateId = () =>
  `staff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

/**
 * @typedef {object} StaffMemberData - Represents the core data structure for a staff member.
 * @property {string} id - Unique identifier (generated or existing).
 * @property {string} name - Staff member's full name.
 * @property {string} [employeeNumber] - Optional identifier/number.
 * @property {string} [defaultUnit] - Default unit assignment.
 * @property {string} [defaultGroup] - Default group assignment.
 * @property {string} [defaultJobTitle] - Default job title assignment.
 * @property {boolean} isActive - Indicates if the staff member is currently active.
 * @property {number} sortOrder - Numerical value for sorting purposes (managed by parent).
 */

/**
 * @typedef {object} StaffEditSubModalGlobalSettings - Subset of global settings needed for dropdowns.
 * @property {string[]} [units] - List of available unit names.
 * @property {string[]} [groups] - List of available group names.
 * @property {string[]} [jobTitles] - List of available job title names.
 */

/**
 * @typedef {object} StaffEditSubModalProps
 * @property {StaffMemberData | null} staffMember - The staff member data to edit. If `null`, the modal operates in 'add new' mode.
 * @property {StaffEditSubModalGlobalSettings} globalSettings - An object containing global category lists needed for dropdowns.
 * @property {function(StaffMemberData): void} onSave - Callback function executed when the user clicks the 'Save' button. Receives the updated local staff data object.
 * @property {function(): void} onClose - Callback function executed when the user clicks the 'Close' or 'Cancel' button.
 */

/**
 * A modal component used within the main SettingsModal for adding or editing
 * the core details of a staff member (name, default categories, active status, employee number).
 * It operates on a local copy of the staff data and calls the `onSave` callback
 * to pass the updated data back to the parent modal for final processing.
 *
 * @param {StaffEditSubModalProps} props - Component props.
 * @returns {JSX.Element} The rendered modal for editing or adding staff core data.
 */
const StaffEditSubModal = ({
  staffMember,
  globalSettings,
  onSave,
  onClose,
}) => {
  // ==========================================================================
  // State Variables
  // ==========================================================================

  /**
   * @state {object} localData - Holds the staff member's data being edited or created within this modal.
   * Initialized based on whether `staffMember` prop is provided (edit mode) or not (add mode).
   */
  const [localData, setLocalData] = useState({
    id: "",
    name: "",
    employeeNumber: "",
    defaultUnit: "",
    defaultGroup: "",
    defaultJobTitle: "",
    isActive: true,
    sortOrder: 0, // sortOrder is managed by the parent (SettingsModal) upon saving the full list
  });

  /**
   * @state {string} error - Stores validation error messages to be displayed to the user.
   */
  const [error, setError] = useState("");

  /**
   * @state {boolean} devMode - Developer mode flag to enable manual ID editing.
   * Activated by Ctrl+Shift+D keyboard shortcut.
   */
  const [devMode, setDevMode] = useState(false);

  // ==========================================================================
  // Derived State & Constants
  // ==========================================================================

  /**
   * @constant {boolean} isEditing - Determines if the modal is in 'edit' mode (true) or 'add' mode (false).
   */
  const isEditing = staffMember !== null;

  // ==========================================================================
  // Hooks
  // ==========================================================================

  /**
   * @effect Initializes or updates the `localData` state when the modal opens or the `staffMember` prop changes.
   * Sets default values for adding a new staff member or populates the state with the existing staff member's data for editing.
   * Clears any previous error messages.
   */
  useEffect(() => {
    if (isEditing) {
      // Populate state with existing data for editing
      setLocalData({
        ...staffMember, // Spread existing data
      });
    } else {
      // Set default values for adding a new staff member
      setLocalData({
        id: generateId(), // Generate a new unique ID
        name: "",
        employeeNumber: "",
        defaultUnit: "",
        defaultGroup: "",
        defaultJobTitle: "",
        isActive: true,
        sortOrder: 0, // Actual sortOrder determined by parent modal
      });
    }
    setError(""); // Clear errors when modal initializes or staff member changes
  }, [staffMember, isEditing]);

  /**
   * @effect Handles keyboard shortcuts for developer mode.
   * Ctrl+Shift+D toggles developer mode for manual ID editing.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setDevMode((prev) => {
          const newMode = !prev;
          if (newMode) {
            console.log(
              "🛠️ DEVELOPER MODE ENABLED - Manual ID editing is now available!",
            );
            console.log(
              "💡 TIP: Use your original staff IDs (e.g., staff_demo_1, staff_demo_2) to restore weekly schedules.",
            );
            console.log("⌨️  Press Ctrl+Shift+D again to disable dev mode.");
          } else {
            console.log("🛠️ Developer mode DISABLED - ID editing locked.");
          }
          return newMode;
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * @function handleChange
   * Updates the `localData` state when any form input value changes.
   * Handles both text inputs and checkboxes.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - The input change event object.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * @function handleSaveClick
   * Validates the form data (currently checks for non-empty name)
   * and calls the `onSave` prop function with the current `localData` state if validation passes.
   * Displays an error message if validation fails.
   */
  const handleSaveClick = () => {
    setError(""); // Clear previous errors

    // Validate name field
    if (!localData.name.trim()) {
      setError("Név megadása kötelező!"); // Set error if name is empty
      return; // Stop the save process
    }

    // Validate ID field in developer mode
    if (devMode && !localData.id.trim()) {
      setError(
        "Fejlesztői módban az ID mező nem lehet üres! Adjon meg egy egyedi azonosítót a korábbi beosztások helyreállításához.",
      );
      return; // Stop the save process
    }

    onSave(localData); // Pass the validated data to the parent component
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-edit-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 id="staff-edit-modal-title" className="text-lg font-semibold">
            {isEditing ? "Dolgozó szerkesztése" : "Új dolgozó hozzáadása"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Developer Mode Indicator */}
          {devMode && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 font-bold">🛠️ DEV MODE</span>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-yellow-700 mb-2">
                    Fejlesztői mód aktív - Az ID mező szerkeszthető.
                    <kbd className="px-1 py-0.5 text-xs font-mono bg-yellow-200 rounded">
                      Ctrl+Shift+D
                    </kbd>{" "}
                    a kikapcsoláshoz.
                  </p>
                  <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded border">
                    <p className="font-semibold mb-1">
                      💡 Eredeti ID-k megtalálása:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Nyissa meg a böngésző Developer Tools-t (F12)</li>
                      <li>
                        Menjen az Application/Storage - IndexedDB -
                        firebaseLocalStorageDb lapra
                      </li>
                      <li>
                        Vagy ellenőrizze a heti beosztásokat a Firestore
                        konzolban
                      </li>
                      <li>
                        Keresse meg a staff objektumokat (pl. staff_demo_1,
                        staff_demo_2)
                      </li>
                      <li>
                        Használja ezeket az ID-kat a beosztások
                        helyreállításához
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display Area */}
          {error && (
            <p
              className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Staff ID Input (Developer Mode Conditional) */}
          <div>
            <label
              htmlFor="staffId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Azonosító (ID){" "}
              {devMode && (
                <span className="text-yellow-600 font-bold">
                  [SZERKESZTHETŐ]
                </span>
              )}
            </label>
            <input
              type="text"
              id="staffId"
              name="id"
              value={localData.id}
              onChange={devMode ? handleChange : undefined}
              readOnly={!devMode}
              className={`w-full p-2 border rounded ${
                devMode
                  ? "focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-yellow-50"
                  : "bg-gray-100 text-gray-600 cursor-not-allowed"
              }`}
              aria-describedby="staffIdHelp"
              placeholder={
                devMode ? "Adja meg az egyedi staff ID-t..." : undefined
              }
            />
            <p id="staffIdHelp" className="text-xs text-gray-500 mt-1">
              {devMode
                ? "⚠️ FONTOS: Használja a meglévő ID-kat a korábbi beosztások helyreállításához. Nyomja meg Ctrl+Shift+D az automatikus generáláshoz."
                : "Automatikusan generált azonosító."}
            </p>
          </div>

          {/* Staff Name Input */}
          <div>
            <label
              htmlFor="staffName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Név <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="staffName"
              name="name"
              value={localData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              aria-required="true"
            />
          </div>

          {/* Employee Number Input (Optional) */}
          <div>
            <label
              htmlFor="employeeNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Azonosító / Sorszám (opcionális)
            </label>
            <input
              type="text"
              id="employeeNumber"
              name="employeeNumber"
              value={localData.employeeNumber || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Pl. 1, 2, K1..."
              aria-describedby="employeeNumberHelp"
            />
            <p id="employeeNumberHelp" className="text-xs text-gray-500 mt-1">
              Megjelenik a fő táblázatban a név mellett.
            </p>
          </div>

          {/* Default Unit Select */}
          <div>
            <label
              htmlFor="defaultUnit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Alapértelmezett Egység
            </label>
            <select
              id="defaultUnit"
              name="defaultUnit"
              value={localData.defaultUnit || ""} // Ensure controlled component
              onChange={handleChange}
              className="w-full p-2 border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Nincs</option>
              {(globalSettings?.units || []).map((unit) => (
                <option key={`unit-${unit}`} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Default Group Select */}
          <div>
            <label
              htmlFor="defaultGroup"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Alapértelmezett Csoport
            </label>
            <select
              id="defaultGroup"
              name="defaultGroup"
              value={localData.defaultGroup || ""} // Ensure controlled component
              onChange={handleChange}
              className="w-full p-2 border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Nincs</option>
              {(globalSettings?.groups || []).map((group) => (
                <option key={`group-${group}`} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Default Job Title Select */}
          <div>
            <label
              htmlFor="defaultJobTitle"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Alapértelmezett Munkakör
            </label>
            <select
              id="defaultJobTitle"
              name="defaultJobTitle"
              value={localData.defaultJobTitle || ""} // Ensure controlled component
              onChange={handleChange}
              className="w-full p-2 border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Nincs</option>
              {(globalSettings?.jobTitles || []).map((title) => (
                <option key={`title-${title}`} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Is Active Checkbox */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={localData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 select-none"
            >
              Aktív dolgozó (megjelenik a beosztásban)
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >
            Mégsem
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <Save className="w-4 h-4 mr-1.5" aria-hidden="true" /> Mentés
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffEditSubModal;

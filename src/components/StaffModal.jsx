import React, { useState, useEffect, useCallback } from "react";
import { Plus, PlusCircle, X, Trash2, HelpCircle } from "lucide-react";
import {
  formatDate,
  getDayName,
  getContrastingTextColor,
} from "../utils/helpers";

/**
 * @typedef {object} StaffWeeklyData - Represents a staff member's data for a specific week, including potential overrides.
 * @property {string} staffId - Unique identifier for the staff member.
 * @property {string} name - Staff member's name (potentially overridden for the week, though usually consistent).
 * @property {string} [employeeNumber] - Optional employee identifier/number (from global data).
 * @property {string} [unit] - Assigned unit for this specific week (overrides default).
 * @property {string} [group] - Assigned group for this specific week (overrides default).
 * @property {string} [jobTitle] - Assigned job title for this specific week (overrides default).
 * @property {object.<string, string>} [shifts] - Mapping of date strings ('YYYY-MM-DD') to shift codes for this week.
 */

/**
 * @typedef {object} StaffModalGlobalSettings - Relevant global settings for the StaffModal.
 * @property {string[]} [units] - List of available unit names.
 * @property {string[]} [groups] - List of available group names.
 * @property {string[]} [jobTitles] - List of available job title names.
 * @property {Array<{code: string, name: string, color: string}>} [shiftTypes] - List of defined shift types.
 * @property {object.<string, string>} [timeSlots] - Mapping of shift codes to time slot descriptions.
 * @property {Array<{id: string, isActive: boolean, defaultUnit?: string, defaultGroup?: string, defaultJobTitle?: string}>} [staffList] - List of staff members (used for checking defaults when removing categories).
 */

/**
 * @typedef {object} StaffModalProps
 * @property {StaffWeeklyData} editingStaff - The initial weekly data for the staff member being edited.
 * @property {StaffModalGlobalSettings} globalSettings - Global application settings containing lists for categories and shifts.
 * @property {Date[]} weekDates - An array of Date objects representing the days of the week being edited.
 * @property {function(string): string} getShiftColor - A function to retrieve the background color for a given shift code.
 * @property {function(StaffWeeklyData): void} handleSaveStaff - Callback function to save the updated weekly staff data. Receives the modified local staff data object.
 * @property {function(string): Promise<boolean>} handleAddUnit - Callback function to add a new unit to global settings. Returns true on success.
 * @property {function(string): Promise<boolean>} handleAddGroup - Callback function to add a new group to global settings. Returns true on success.
 * @property {function(string): Promise<boolean>} handleAddJobTitle - Callback function to add a new job title to global settings. Returns true on success.
 * @property {function(string): Promise<boolean>} handleRemoveUnit - Callback function to remove a unit from global settings. Returns true on success.
 * @property {function(string): Promise<boolean>} handleRemoveGroup - Callback function to remove a group from global settings. Returns true on success.
 * @property {function(string): Promise<boolean>} handleRemoveJobTitle - Callback function to remove a job title from global settings. Returns true on success.
 * @property {function(): void} onClose - Callback function to close the modal without saving.
 */

/**
 * A modal for editing a specific staff member's weekly schedule details,
 * including their assigned unit, group, job title (overriding defaults for the week),
 * and daily shift assignments. Allows adding new global categories (unit, group, job title)
 * and removing existing ones directly from the modal.
 *
 * @param {StaffModalProps} props - Component props.
 * @returns {JSX.Element} The rendered staff editing modal.
 */
const StaffModal = ({
  editingStaff,
  globalSettings,
  weekDates,
  getShiftColor,
  handleSaveStaff,
  handleAddUnit,
  handleAddGroup,
  handleAddJobTitle,
  handleRemoveUnit,
  handleRemoveGroup,
  handleRemoveJobTitle,
  onClose,
}) => {
  // ==========================================================================
  // State Variables
  // ==========================================================================

  /**
   * @state {object} localStaffData - Holds the staff member's data being edited within this modal.
   * Initialized with a copy of the `editingStaff` prop.
   */
  const [localStaffData, setLocalStaffData] = useState({ ...editingStaff });

  /**
   * @state {string} newUnit - Input state for adding a new unit.
   */
  const [newUnit, setNewUnit] = useState("");
  /**
   * @state {string} newGroup - Input state for adding a new group.
   */
  const [newGroup, setNewGroup] = useState("");
  /**
   * @state {string} newJobTitle - Input state for adding a new job title.
   */
  const [newJobTitle, setNewJobTitle] = useState("");

  /**
   * @state {boolean} showUnitInput - Controls visibility of the add unit input field.
   */
  const [showUnitInput, setShowUnitInput] = useState(false);
  /**
   * @state {boolean} showGroupInput - Controls visibility of the add group input field.
   */
  const [showGroupInput, setShowGroupInput] = useState(false);
  /**
   * @state {boolean} showJobTitleInput - Controls visibility of the add job title input field.
   */
  const [showJobTitleInput, setShowJobTitleInput] = useState(false);

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * @effect Updates the local state (`localStaffData`) and resets the add-category input fields
   * whenever the `editingStaff` prop changes. This ensures the modal reflects the correct
   * data when opened for a different staff member or if the underlying data changes.
   */
  useEffect(() => {
    console.log(
      "StaffModal useEffect: Updating localStaffData from prop",
      editingStaff,
    );
    setLocalStaffData({ ...editingStaff });
    // Reset add inputs when modal reopens for different staff
    setShowUnitInput(false);
    setNewUnit("");
    setShowGroupInput(false);
    setNewGroup("");
    setShowJobTitleInput(false);
    setNewJobTitle("");
  }, [editingStaff]);

  // ==========================================================================
  // Callback Handlers for Local State Updates
  // ==========================================================================

  /**
   * @callback handleLocalChange
   * Updates a specific field in the `localStaffData` state.
   * Memoized for performance.
   * @param {string} field - The key of the field to update in `localStaffData`.
   * @param {*} value - The new value for the field.
   */
  const handleLocalChange = useCallback((field, value) => {
    setLocalStaffData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * @callback handleLocalShiftChange
   * Updates the shift assignment for a specific date in the `localStaffData.shifts` object.
   * Memoized for performance.
   * @param {string} dateString - The date string (YYYY-MM-DD) for the shift being changed.
   * @param {string} shiftCode - The new shift code selected for that date.
   */
  const handleLocalShiftChange = useCallback((dateString, shiftCode) => {
    setLocalStaffData((prev) => ({
      ...prev,
      shifts: {
        ...(prev.shifts || {}), // Ensure prev.shifts exists
        [dateString]: shiftCode,
      },
    }));
  }, []);

  // ==========================================================================
  // Category Management Functions (Interact with Global Settings via Props)
  // ==========================================================================

  /**
   * @function addCategoryAndSelectLocal
   * Adds a new category item to the global settings via a provided callback (`adderFunc`),
   * then selects the newly added item in the modal's local state for the current staff member's weekly data.
   * Handles UI updates like clearing and hiding the input field.
   * @async
   * @param {string} newItem - The name of the new category item to add.
   * @param {Function} adderFunc - The async callback function (e.g., `handleAddUnit`) to add the item globally. Should return a Promise resolving to boolean success.
   * @param {Function} setNewItemFunc - State setter function to clear the corresponding input field (e.g., `setNewUnit`).
   * @param {Function} setShowInputFunc - State setter function to hide the corresponding input field (e.g., `setShowUnitInput`).
   * @param {string} localField - The field name in `localStaffData` to update with the new item (e.g., 'unit').
   * @param {string} categoryNameSingular - The singular name of the category (e.g., 'egység') for alert messages.
   */
  const addCategoryAndSelectLocal = async (
    newItem,
    adderFunc,
    setNewItemFunc,
    setShowInputFunc,
    localField,
    categoryNameSingular,
  ) => {
    const trimmedItem = newItem.trim();
    if (!trimmedItem) return;
    try {
      const success = await adderFunc(trimmedItem);
      if (success) {
        handleLocalChange(localField, trimmedItem); // Select the newly added item locally
        setNewItemFunc(""); // Clear input
        setShowInputFunc(false); // Hide input field
      } else {
        // Error likely handled by hook's saveError state, but alert as fallback
        alert(
          `Ez a(z) ${categoryNameSingular} már létezik vagy hiba történt a mentéskor.`,
        );
      }
    } catch (error) {
      console.error(`Error adding ${categoryNameSingular}:`, error);
      alert(
        `Hiba történt a(z) ${categoryNameSingular} hozzáadásakor: ${error.message}`,
      );
    }
  };

  /** @function addUnit - Specific handler to add a Unit */
  const addUnit = () =>
    addCategoryAndSelectLocal(
      newUnit,
      handleAddUnit,
      setNewUnit,
      setShowUnitInput,
      "unit",
      "egység",
    );
  /** @function addGroup - Specific handler to add a Group */
  const addGroup = () =>
    addCategoryAndSelectLocal(
      newGroup,
      handleAddGroup,
      setNewGroup,
      setShowGroupInput,
      "group",
      "csoport",
    );
  /** @function addJobTitle - Specific handler to add a Job Title */
  const addJobTitle = () =>
    addCategoryAndSelectLocal(
      newJobTitle,
      handleAddJobTitle,
      setNewJobTitle,
      setShowJobTitleInput,
      "jobTitle",
      "munkakör",
    );

  /**
   * @function removeCategoryAndClearLocal
   * Removes a category item from the global settings via a provided callback (`removerFunc`)
   * after user confirmation. If the removed item was selected in the local state, it clears the selection.
   * Shows a warning if the item is used as a default by any staff member.
   * @async
   * @param {string} itemToRemove - The category item string to remove.
   * @param {Function} removerFunc - The async callback function (e.g., `handleRemoveUnit`) to remove the item globally. Should return a Promise resolving to boolean success.
   * @param {string} localField - The field name in `localStaffData` to potentially clear (e.g., 'unit').
   * @param {string} categoryNameSingular - The singular name of the category (e.g., 'egység') for confirmation/alert messages.
   */
  const removeCategoryAndClearLocal = async (
    itemToRemove,
    removerFunc,
    localField,
    categoryNameSingular,
  ) => {
    if (!itemToRemove) return;

    // Check if the item is used as a default elsewhere (informational warning)
    const defaultFieldCheck = localField.startsWith("default")
      ? localField
      : `default${localField.charAt(0).toUpperCase() + localField.slice(1)}`; // Construct potential default field name like 'defaultUnit'
    const staffUsingDefault = globalSettings?.staffList?.some(
      (staff) => staff.isActive && staff[defaultFieldCheck] === itemToRemove,
    );

    let confirmMessage = `Biztosan törli ezt a(z) ${categoryNameSingular} (${itemToRemove}) elemet a globális listából?`;
    if (staffUsingDefault) {
      confirmMessage += `\nFigyelem: Ezt az értéket legalább egy aktív dolgozó alapértelmezettként használja!`;
    }

    if (!window.confirm(confirmMessage)) {
      return; // User cancelled
    }

    try {
      const success = await removerFunc(itemToRemove);
      if (success) {
        // If global removal succeeded, clear local selection if it matches
        if (localStaffData[localField] === itemToRemove) {
          handleLocalChange(localField, "");
        }
        // Hide add input field if it was open for this category
        if (localField === "unit") setShowUnitInput(false);
        if (localField === "group") setShowGroupInput(false);
        if (localField === "jobTitle") setShowJobTitleInput(false);
      } else {
        alert(`Hiba történt a(z) ${categoryNameSingular} törlésekor.`);
      }
    } catch (error) {
      console.error(`Error removing ${categoryNameSingular}:`, error);
      alert(
        `Hiba történt a(z) ${categoryNameSingular} törlésekor: ${error.message}`,
      );
    }
  };

  // ==========================================================================
  // Save and Close Handlers
  // ==========================================================================

  /**
   * @function saveChanges
   * Validates the local staff data (checks for name) and then calls
   * the `handleSaveStaff` prop function to persist the changes for the week.
   * The parent component is responsible for closing the modal on success.
   */
  const saveChanges = () => {
    // Pass the entire localStaffData (containing weekly overrides) to the save handler
    handleSaveStaff(localStaffData);
    // Parent (App.js) should handle closing the modal after state update via hook
  };

  // ==========================================================================
  // Rendering Functions
  // ==========================================================================

  /**
   * @function renderDropdownField
   * Renders a category dropdown (select) field with integrated buttons
   * for adding a new category item or removing the currently selected one.
   * Handles showing/hiding the input field for adding new items.
   *
   * @param {string} label - The label for the form field.
   * @param {string} value - The current value of the field from `localStaffData`.
   * @param {string[]} [options=[]] - The array of available options from `globalSettings`.
   * @param {string} placeholder - Placeholder text for the dropdown when no value is selected.
   * @param {Function} onChange - Callback to update the `localStaffData` field (e.g., `handleLocalChange`).
   * @param {boolean} showInput - State variable indicating if the 'add new' input is visible.
   * @param {Function} setShowInput - State setter function to toggle the 'add new' input visibility.
   * @param {string} newValue - State variable holding the value of the 'add new' input field.
   * @param {Function} setNewValue - State setter function for the 'add new' input field.
   * @param {Function} handleAdd - Callback function to handle adding the new item globally and locally (e.g., `addUnit`).
   * @param {string} localField - The key of the field in `localStaffData` (e.g., 'unit').
   * @param {string} categoryNameSingular - The singular name of the category (e.g., 'egység') for tooltips and placeholders.
   * @param {Function} removerFunc - The actual hook callback function for removing globally (passed to `removeCategoryAndClearLocal`).
   * @returns {JSX.Element} The rendered dropdown field component.
   */
  const renderDropdownField = (
    label,
    value,
    options = [],
    placeholder,
    onChange,
    showInput,
    setShowInput,
    newValue,
    setNewValue,
    handleAdd,
    localField,
    categoryNameSingular,
    removerFunc,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {showInput ? (
          <div className="flex items-center flex-wrap gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Új ${categoryNameSingular} neve...`}
              className="flex-grow p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[150px]"
              aria-label={`Új ${categoryNameSingular} hozzáadása`}
              autoFocus
            />
            <div className="flex flex-shrink-0">
              <button
                onClick={handleAdd}
                className="px-3 py-2 bg-green-600 text-white rounded-l hover:bg-green-700 flex-shrink-0"
                title={`Új ${categoryNameSingular} hozzáadása`}
                aria-label={`Mentés: Új ${categoryNameSingular}`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setNewValue("");
                  setShowInput(false);
                }}
                className="px-3 py-2 bg-gray-400 text-white rounded-r hover:bg-gray-500 flex-shrink-0 border-l border-gray-500"
                title="Mégsem"
                aria-label="Új elem hozzáadásának megszakítása"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <select
              value={value || ""} // Ensure controlled component, default to empty string
              onChange={(e) => onChange(localField, e.target.value)}
              className="w-full p-2 border rounded-l bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              aria-label={label}
            >
              <option value="">{placeholder}</option>
              {(options || []).map((option) => (
                <option key={`${localField}-${option}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowInput(true)}
              className="px-2 py-2 bg-blue-500 text-white hover:bg-blue-600 flex-shrink-0"
              title={`Új ${categoryNameSingular} hozzáadása`}
              aria-label={`Új ${categoryNameSingular} hozzáadása`}
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            {value && ( // Only show remove button if a value is selected
              <button
                onClick={() =>
                  removeCategoryAndClearLocal(
                    value,
                    removerFunc, // Pass the function that calls the hook
                    localField,
                    categoryNameSingular,
                  )
                }
                className="px-2 py-2 bg-red-500 text-white rounded-r hover:bg-red-600 flex-shrink-0"
                title={`${categoryNameSingular} (${value}) törlése a globális listából`}
                aria-label={`Törlés: ${value} (${categoryNameSingular})`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================================================
  // Main Component Render
  // ==========================================================================

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 id="staff-modal-title" className="text-xl font-semibold truncate">
            Dolgozó heti beosztásának szerkesztése: {localStaffData.name}
            {localStaffData.employeeNumber
              ? ` (Azon: ${localStaffData.employeeNumber})`
              : ""}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          {/* Staff Info & Weekly Category Overrides */}
          <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <legend className="col-span-full text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <span>Dolgozó heti adatai</span>
              <span
                className="cursor-help text-gray-500"
                title="Az itt megadott Egység, Csoport és Munkakör csak erre a hétre vonatkozik, felülírva a dolgozó alapértelmezett beállításait. Az alapértelmezett adatok a Beállítások / Dolgozók menüpontban módosíthatók."
              >
                <HelpCircle size={16} aria-hidden="true" />
              </span>
            </legend>
            <div>
              <label
                htmlFor={`name-${localStaffData.staffId}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Név
              </label>
              <input
                type="text"
                id={`name-${localStaffData.staffId}`}
                value={localStaffData.name || ""}
                className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-100 cursor-not-allowed"
                readOnly
              />
            </div>
            {/* Unit Dropdown Field */}
            {renderDropdownField(
              "Egység (heti)",
              localStaffData.unit,
              globalSettings?.units,
              "Nincs egység",
              handleLocalChange,
              showUnitInput,
              setShowUnitInput,
              newUnit,
              setNewUnit,
              addUnit,
              "unit",
              "egység",
              handleRemoveUnit, // Pass hook func again for remove button
            )}
            {/* Group Dropdown Field */}
            {renderDropdownField(
              "Csoport (heti)",
              localStaffData.group,
              globalSettings?.groups,
              "Nincs csoport",
              handleLocalChange,
              showGroupInput,
              setShowGroupInput,
              newGroup,
              setNewGroup,
              addGroup,
              "group",
              "csoport",
              handleRemoveGroup,
            )}
            {/* Job Title Dropdown Field */}
            {renderDropdownField(
              "Munkakör (heti)",
              localStaffData.jobTitle,
              globalSettings?.jobTitles,
              "Nincs munkakör",
              handleLocalChange,
              showJobTitleInput,
              setShowJobTitleInput,
              newJobTitle,
              setNewJobTitle,
              addJobTitle,
              "jobTitle",
              "munkakör",
              handleRemoveJobTitle,
            )}
          </fieldset>

          {/* Weekly Shift Assignments */}
          <fieldset>
            <legend className="font-medium mb-3 text-base">
              Műszak beosztás (erre a hétre)
            </legend>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {weekDates.map((date) => {
                const dateString = date.toISOString().split("T")[0];
                const currentShiftCode =
                  localStaffData.shifts?.[dateString] || "";
                const shiftInfo = globalSettings?.shiftTypes?.find(
                  (st) => st.code === currentShiftCode,
                );
                const shiftTime = globalSettings?.timeSlots?.[currentShiftCode];
                const shiftTitle = shiftInfo
                  ? `${shiftInfo.name}${shiftTime ? ` (${shiftTime})` : ""}`
                  : "Nincs műszak";
                const bgColor = getShiftColor(currentShiftCode);
                const textColor = getContrastingTextColor(bgColor);

                return (
                  <div key={dateString}>
                    <label
                      htmlFor={`shift-${dateString}-${localStaffData.staffId}`}
                      className="block text-xs font-medium text-gray-600 mb-1 text-center"
                    >
                      {getDayName(date)}
                      <br />
                      {formatDate(date)}
                    </label>
                    <select
                      id={`shift-${dateString}-${localStaffData.staffId}`}
                      value={currentShiftCode}
                      onChange={(e) =>
                        handleLocalShiftChange(dateString, e.target.value)
                      }
                      className="w-full p-2 border rounded appearance-none text-center font-medium cursor-pointer focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none",
                      }}
                      title={shiftTitle}
                      aria-label={`Műszak ${formatDate(date)} napra`}
                    >
                      {/* Default empty option */}
                      <option
                        value=""
                        style={{ backgroundColor: "white", color: "black" }}
                      >
                        -
                      </option>
                      {/* Options from global settings */}
                      {(globalSettings?.shiftTypes || []).map((type) => (
                        <option
                          key={type.code}
                          value={type.code}
                          style={{
                            backgroundColor: type.color || "#ffffff", // Fallback color
                            color: getContrastingTextColor(type.color),
                          }}
                        >
                          {type.code}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end space-x-3 flex-shrink-0 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >
            Mégsem
          </button>
          <button
            type="button"
            onClick={saveChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Heti adatok mentése
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffModal;

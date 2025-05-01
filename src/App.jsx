import React, { useState, useRef, useMemo, useCallback } from "react";
import { Calendar, Loader, Home, AlertTriangle } from "lucide-react";

// Component Imports
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScheduleTable from "./components/ScheduleTable";
import StaffModal from "./components/StaffModal";
import SettingsModal from "./components/SettingsModal";
import Legend from "./components/Legend";
import LoginPage from "./components/LoginPage";

// Hook Imports
import useStaffData from "./hooks/useStaffData";
import { useAuth } from "./contexts/AuthContext";

// Utility Imports
import {
  getCurrentMonday,
  getWeekDates,
  getWeekRangeString,
  isEvenWeek,
  formatDate,
} from "./utils/helpers";

/**
 * The main application component that orchestrates the display and management
 * of the nurse scheduling interface. It handles authentication, data fetching via the
 * `useStaffData` hook, week navigation, modal management, and rendering of core UI elements.
 *
 * @returns {JSX.Element} The rendered nurse scheduler application or relevant loading/error/login states.
 */
const NurseSchedulerApp = () => {
  // ==========================================================================
  // Hooks
  // ==========================================================================

  /**
   * Authentication context hook to get the current user.
   */
  const { currentUser } = useAuth();

  /**
   * State hook for tracking the Monday of the currently displayed week.
   * @type {[Date, React.Dispatch<React.SetStateAction<Date>>]}
   */
  const [currentWeek, setCurrentWeek] = useState(getCurrentMonday());

  /**
   * State hook for storing the data of the staff member currently being edited in the StaffModal.
   * @type {[object | null, React.Dispatch<React.SetStateAction<object | null>>]}
   */
  const [editingStaff, setEditingStaff] = useState(null);

  /**
   * State hook to control the visibility of the StaffModal.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [showModal, setShowModal] = useState(false);

  /**
   * State hook to control the visibility of the SettingsModal.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  /**
   * State hook to track if a "copy week" operation is in progress.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [isCopying, setIsCopying] = useState(false);

  /**
   * Ref hook to reference the printable area of the schedule.
   * @type {React.MutableRefObject<HTMLDivElement | null>}
   */
  const printableAreaRef = useRef(null);

  /**
   * Custom hook to fetch and manage staff, schedule, and settings data.
   * Provides data state (globalSettings, isLoading, errors) and functions to modify data.
   */
  const {
    globalSettings,
    demoGlobalSettings,
    settingsLoading,
    scheduleLoading: dataHookLoading,
    saveError,
    saveGlobalSettings,
    handleAddUnit,
    handleRemoveUnit,
    handleAddGroup,
    handleRemoveGroup,
    handleAddJobTitle,
    handleRemoveJobTitle,
    handleUpdateShiftTypes,
    updateStaffInWeeklySchedule,
    removeStaffFromWeeklySchedule,
    getShiftColor,
    getStaffByUnit,
    copyScheduleFromWeek,
  } = useStaffData(currentWeek);

  // ==========================================================================
  // Memoized Values & Derived State
  // ==========================================================================

  /**
   * Combined loading state from settings and schedule data hooks.
   * @type {boolean}
   */
  const isLoading = useMemo(
    () => settingsLoading || dataHookLoading,
    [settingsLoading, dataHookLoading],
  );

  /**
   * Array of Date objects for the currently selected week (Mon-Sat).
   * @type {Date[]}
   */
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  /**
   * Formatted string representing the date range of the current week.
   * @type {string}
   */
  const weekRange = useMemo(() => getWeekRangeString(weekDates), [weekDates]);

  /**
   * String indicating whether the current week is "páros" (even) or "páratlan" (odd).
   * @type {string}
   */
  const weekParity = useMemo(
    () => (isEvenWeek(currentWeek) ? "páros" : "páratlan"),
    [currentWeek],
  );

  /**
   * Staff data grouped by unit, prepared for display in the ScheduleTable.
   * Recalculated when loading state, global settings, or the `getStaffByUnit` function changes.
   * @type {object} - An object where keys are unit names and values are arrays of staff objects.
   */
  const staffByUnit = useMemo(() => {
    if (isLoading || !globalSettings) return {};
    return getStaffByUnit();
  }, [isLoading, globalSettings, getStaffByUnit]); // getStaffByUnit dependency ensures recalc when its internal logic changes

  /**
   * Options for the "copy schedule" dropdown, representing the previous 4 weeks.
   * @type {Array<{value: string, label: string, displayLabel: string}>}
   */
  const copyOptions = useMemo(() => {
    return [-1, -2, -3, -4].map((val) => {
      const date = new Date(currentWeek);
      date.setDate(date.getDate() + val * 7);
      const parity = isEvenWeek(date) ? "páros" : "páratlan";
      const formattedDate = formatDate(date);
      return {
        value: String(val),
        label: `${Math.abs(val)} héttel ezelőtt (${val})`,
        displayLabel: `${Math.abs(val)} héttel ezelőtt (${formattedDate} - ${parity})`,
      };
    });
  }, [currentWeek]);

  /**
   * Flag indicating whether there is any schedule data loaded for the current week.
   * @type {boolean}
   */
  const currentScheduleExists = useMemo(
    () => Object.keys(staffByUnit).length > 0,
    [staffByUnit],
  );

  // ==========================================================================
  // Event Handlers & Callbacks
  // ==========================================================================

  /**
   * @function handleEditStaff
   * Opens the StaffModal to edit a specific staff member's weekly data.
   * Prepares the data structure required by the modal.
   * @param {object} staffWeeklyData - The full weekly data object for the staff member from `staffByUnit`.
   */
  const handleEditStaff = useCallback((staffWeeklyData) => {
    const staffDataForModal = {
      staffId: staffWeeklyData.staffId,
      name: staffWeeklyData.name,
      unit: staffWeeklyData.unit,
      group: staffWeeklyData.group,
      jobTitle: staffWeeklyData.jobTitle,
      shifts: staffWeeklyData.shifts || {},
      employeeNumber: staffWeeklyData.employeeNumber,
    };
    setEditingStaff(staffDataForModal);
    setShowModal(true);
  }, []);

  /**
   * @function handleDeleteStaffFromWeek
   * Removes a staff member from the current week's schedule after confirmation.
   * Uses the `removeStaffFromWeeklySchedule` function from the `useStaffData` hook.
   * @param {string} staffId - The ID of the staff member to remove.
   */
  const handleDeleteStaffFromWeek = useCallback(
    (staffId) => {
      const staffMember = globalSettings?.staffList.find(
        (s) => s.id === staffId,
      );
      const azonositoPart = staffMember?.employeeNumber
        ? ` (Azon: ${staffMember.employeeNumber})`
        : "";
      const staffName = staffMember
        ? `${staffMember.name}${azonositoPart}`
        : `Belső ID: ${staffId}`;
      const confirmMessage = `Biztosan eltávolítja "${staffName}" dolgozót a ${formatDate(currentWeek)} héten kezdődő beosztásból? \n(Ez csak ebből a hétből törli, a törzsadatból nem.)`;

      if (window.confirm(confirmMessage)) {
        removeStaffFromWeeklySchedule(staffId);
      }
    },
    [globalSettings, currentWeek, removeStaffFromWeeklySchedule],
  );

  /**
   * @function handleSaveStaffWeeklyData
   * Saves the edited weekly data for a staff member via the StaffModal.
   * Validates required fields and calls the `updateStaffInWeeklySchedule` function from the hook.
   * Closes the StaffModal upon successful initiation of the save.
   * @param {object} updatedStaffWeeklyData - The updated data object from the StaffModal.
   */
  const handleSaveStaffWeeklyData = useCallback(
    (updatedStaffWeeklyData) => {
      if (!updatedStaffWeeklyData.name?.trim()) {
        alert("Név megadása kötelező");
        return;
      }
      updateStaffInWeeklySchedule(updatedStaffWeeklyData);
      setShowModal(false);
      setEditingStaff(null);
    },
    [updateStaffInWeeklySchedule],
  );

  /**
   * @function changeWeek
   * Navigates the schedule forward or backward by a specified number of weeks.
   * Updates the `currentWeek` state.
   * @param {number} direction - The number of weeks to move (-1 for previous, 1 for next).
   */
  const changeWeek = useCallback((direction) => {
    setCurrentWeek((prevWeek) => {
      const newDate = new Date(prevWeek);
      newDate.setDate(newDate.getDate() + direction * 7);
      return newDate;
    });
  }, []);

  /**
   * @function jumpToCurrentWeek
   * Sets the `currentWeek` state to the Monday of the actual current week.
   */
  const jumpToCurrentWeek = useCallback(() => {
    setCurrentWeek(getCurrentMonday());
  }, []);

  /**
   * @function handleCopyWeekSelect
   * Handles the selection from the "copy schedule" dropdown.
   * Confirms the action with the user, sets the `isCopying` state, and calls
   * the `copyScheduleFromWeek` function from the hook. Displays success/error messages.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event from the select element.
   */
  const handleCopyWeekSelect = useCallback(
    async (event) => {
      const selectedValue = event.target.value;
      if (!selectedValue || isCopying) return;

      const weeksAgo = parseInt(selectedValue, 10);
      const sourceWeekDate = new Date(currentWeek);
      sourceWeekDate.setDate(sourceWeekDate.getDate() + weeksAgo * 7);
      const sourceWeekStr = formatDate(sourceWeekDate);
      const sourceWeekParity = isEvenWeek(sourceWeekDate)
        ? "páros"
        : "páratlan";
      const targetWeekStr = formatDate(currentWeek);
      const targetWeekParity = isEvenWeek(currentWeek) ? "páros" : "páratlan";

      if (
        !window.confirm(
          `Biztosan felülírja a JELENLEGI (${targetWeekStr} - ${targetWeekParity}) hét beosztását\n` +
            `a(z) ${Math.abs(weeksAgo)} héttel korábbi (${sourceWeekStr} - ${sourceWeekParity}) hét adataival?`,
        )
      ) {
        event.target.value = ""; // Reset dropdown selection
        return;
      }

      setIsCopying(true);
      try {
        const success = await copyScheduleFromWeek(sourceWeekDate, currentWeek);
        if (success) {
          alert(
            `${Math.abs(weeksAgo)} héttel ezelőtti hét sikeresen átmásolva.`,
          );
        } else {
          // Error message might be set by the hook, provide fallback
          alert(
            `Hiba történt a másolás során. ${saveError || "Ismeretlen hiba."}`,
          );
        }
      } catch (error) {
        console.error("Error during copyScheduleFromWeek call:", error);
        alert(`Váratlan hiba a másolás során: ${error.message}`);
      } finally {
        setIsCopying(false);
        event.target.value = ""; // Reset dropdown selection
      }
    },
    [currentWeek, isCopying, copyScheduleFromWeek, saveError],
  );

  /**
   * @function openSettingsModal
   * Opens the SettingsModal.
   */
  const openSettingsModal = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  /**
   * @function closeSettingsModal
   * Closes the SettingsModal.
   */
  const closeSettingsModal = useCallback(() => {
    setShowSettingsModal(false);
  }, []);

  /**
   * @function closeStaffModal
   * Closes the StaffModal and resets the editing state.
   */
  const closeStaffModal = useCallback(() => {
    setShowModal(false);
    setEditingStaff(null);
  }, []);

  // ==========================================================================
  // Conditional Rendering (Authentication, Loading, Errors)
  // ==========================================================================

  // Render Login Page if no user is authenticated
  if (!currentUser) {
    return <LoginPage />;
  }

  // Render Loading Indicator while fetching initial global settings
  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-16 h-16 animate-spin text-blue-600" />
        <p className="ml-4 text-xl">Alapadatok betöltése...</p>
      </div>
    );
  }

  // Render Critical Error Screen if global settings failed to load
  if (!globalSettings) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-600 p-4 text-center">
        <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Kritikus Hiba</h2>
        <p className="mb-4">Nem sikerült betölteni a globális beállításokat.</p>
        {saveError && (
          <p className="text-sm mt-2 mb-4 bg-red-100 p-2 rounded border border-red-300">
            Hiba: {saveError}
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          aria-label="Oldal újratöltése"
        >
          Oldal újratöltése
        </button>
      </div>
    );
  }

  // ==========================================================================
  // Main Application Render
  // ==========================================================================

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 print:bg-white">
      {/* Header - Hidden during printing */}
      <div className="print:hidden">
        <Header user={currentUser} onSettingsClick={openSettingsModal} />
      </div>

      {/* Save Error Display - Hidden during printing */}
      {saveError && (
        <div className="m-4 print:hidden">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center mb-2"
            role="alert"
          >
            Mentési Hiba: {saveError}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container mx-auto p-4 flex-grow">
        {/* Top Control Bar (Navigation, Week Info, Copy Action) */}
        <div className="flex flex-wrap justify-between items-center mb-6 bg-white p-4 rounded-lg shadow print:shadow-none print:mb-2 print:p-2">
          {/* Week Navigation Controls */}
          <div className="flex items-center space-x-2 mb-2 md:mb-0 print:hidden">
            <button
              onClick={() => changeWeek(-1)}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
              title="Előző hét"
              disabled={isLoading}
              aria-label="Előző hét"
            >
              ←
            </button>
            <button
              onClick={jumpToCurrentWeek}
              className="p-2 bg-blue-100 rounded hover:bg-blue-200"
              title="Ugrás a mai hétre"
              disabled={isLoading}
              aria-label="Ugrás a mai hétre"
            >
              <Home className="w-5 h-5 text-blue-700" />
            </button>
            <button
              onClick={() => changeWeek(1)}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
              title="Következő hét"
              disabled={isLoading}
              aria-label="Következő hét"
            >
              →
            </button>
          </div>

          {/* Current Week Display */}
          <div className="flex items-center text-center mx-auto mb-2 md:mb-0">
            <Calendar
              className="w-5 h-5 mr-2 text-blue-600 print:text-black"
              aria-hidden="true"
            />
            <h2 className="text-lg sm:text-xl font-semibold">
              {weekRange} ({weekParity})
            </h2>
          </div>

          {/* Copy Schedule Dropdown */}
          <div className="flex items-center space-x-2 mb-2 md:mb-0 print:hidden">
            <select
              onChange={handleCopyWeekSelect}
              disabled={isCopying || isLoading}
              className="flex-grow px-3 py-2 border rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 cursor-pointer"
              value="" // Controlled by resetting on change/confirm
              title="Korábbi hét beosztásának másolása erre a hétre"
              aria-label="Beosztás másolása korábbi hétről"
            >
              <option value="" disabled>
                {isCopying ? "Másolás..." : "Beosztás másolása innen..."}
              </option>
              {copyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.displayLabel}
                </option>
              ))}
            </select>
            {/* Copying Loader */}
            {isCopying && (
              <Loader
                className="w-5 h-5 ml-2 animate-spin text-white"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Printable Area Container */}
        <div ref={printableAreaRef} className="print-container">
          {/* Main Schedule Table */}
          <ScheduleTable
            weekDates={weekDates}
            staffByUnit={staffByUnit}
            handleEditStaff={handleEditStaff}
            handleDeleteStaff={handleDeleteStaffFromWeek}
            getShiftColor={getShiftColor}
            timeSlots={globalSettings.timeSlots || {}}
            isLoading={isLoading} // Pass combined loading state
            scheduleExists={currentScheduleExists}
            globalSettings={globalSettings} // Pass full settings for lookups, orphaned checks etc.
          />
          {/* Shift Legend */}
          <Legend
            shiftTypes={globalSettings.shiftTypes || []}
            timeSlots={globalSettings.timeSlots || {}}
            onUpdateShiftTypes={handleUpdateShiftTypes}
          />
        </div>
      </main>

      {/* Footer - Hidden during printing */}
      <div className="print:hidden">
        <Footer />
      </div>

      {/* Modals - Rendered conditionally, outside main flow */}

      {/* Staff Edit Modal */}
      {showModal && editingStaff && globalSettings && (
        <StaffModal
          editingStaff={editingStaff}
          globalSettings={globalSettings}
          weekDates={weekDates}
          getShiftColor={getShiftColor}
          handleSaveStaff={handleSaveStaffWeeklyData}
          handleAddUnit={handleAddUnit}
          handleAddGroup={handleAddGroup}
          handleAddJobTitle={handleAddJobTitle}
          handleRemoveUnit={handleRemoveUnit}
          handleRemoveGroup={handleRemoveGroup}
          handleRemoveJobTitle={handleRemoveJobTitle}
          onClose={closeStaffModal}
        />
      )}

      {/* Global Settings Modal */}
      {showSettingsModal && globalSettings && (
        <SettingsModal
          globalSettings={globalSettings}
          demoGlobalSettings={demoGlobalSettings}
          saveGlobalSettings={saveGlobalSettings} // Pass the unified save function
          handleAddUnit={handleAddUnit}
          handleRemoveUnit={handleRemoveUnit}
          handleAddGroup={handleAddGroup}
          handleRemoveGroup={handleRemoveGroup}
          handleAddJobTitle={handleAddJobTitle}
          handleRemoveJobTitle={handleRemoveJobTitle}
          onClose={closeSettingsModal}
        />
      )}
    </div>
  );
};

export default NurseSchedulerApp;

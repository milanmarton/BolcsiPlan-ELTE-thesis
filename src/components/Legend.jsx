import React, { useState } from "react";
import { Settings } from "lucide-react";
import ShiftTypesModal from "./ShiftTypesModal";
import { getContrastingTextColor } from "../utils/helpers";

/**
 * @typedef {object} LegendProps
 * @property {Array<object>} [shiftTypes=[]] - An array of shift type objects. Each object is expected to have at least 'code', 'name', and 'color' properties. Defaults to an empty array.
 * @property {object} [timeSlots={}] - An object mapping shift codes (string) to their time slot descriptions (string). Defaults to an empty object.
 * @property {function(Array<object>, object): void | boolean} onUpdateShiftTypes - Callback function invoked when shift types are saved via the modal. It receives the updated `newShiftTypes` array and `newTimeSlots` object. Return value can indicate success/failure to the caller if needed, but often void is sufficient if the function handles its own logic/errors.
 */

/**
 * Displays a legend of shift types with their codes, colors, and associated time slots.
 * Provides a button to open a modal for managing (editing/adding/deleting) these shift types.
 *
 * @param {LegendProps} props - The component props.
 * @returns {JSX.Element} The rendered legend component.
 */
const Legend = ({ shiftTypes = [], timeSlots = {}, onUpdateShiftTypes }) => {
  // --- State ---
  /**
   * Controls the visibility of the ShiftTypesModal.
   * @state {boolean} showModal - True if the modal should be displayed, false otherwise.
   */
  const [showModal, setShowModal] = useState(false);

  // --- Handlers ---

  /**
   * Callback handler invoked when the ShiftTypesModal signals a save action.
   * It calls the `onUpdateShiftTypes` prop passed from the parent component.
   * @param {Array<object>} newShiftTypes - The updated array of shift type objects from the modal.
   * @param {object} newTimeSlots - The updated object mapping shift codes to time slots from the modal.
   */
  const handleSaveShiftTypes = (newShiftTypes, newTimeSlots) => {
    // Pass the updated data up to the parent component
    const updateResult = onUpdateShiftTypes(newShiftTypes, newTimeSlots);

    if (updateResult === false) {
      console.error(
        "Parent component indicated failure updating shift types via Legend component.",
      );
    }
  };

  /**
   * Opens the shift types management modal.
   */
  const openModal = () => setShowModal(true);

  /**
   * Closes the shift types management modal.
   */
  const closeModal = () => setShowModal(false);

  // --- Render Logic ---
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 print:shadow-none print:mb-2 print:p-2">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-3 print:mb-1">
        <h3 className="text-lg font-medium print:text-base">
          Műszakok jelmagyarázata
        </h3>
        <button
          onClick={openModal}
          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden"
          aria-label="Műszaktípusok és időpontok szerkesztése"
        >
          <Settings className="w-4 h-4 mr-1" aria-hidden="true" />
          Műszakok kezelése
        </button>
      </div>

      {/* Legend Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 print:grid-cols-8 print:gap-1">
        {shiftTypes.length > 0 ? (
          shiftTypes.map((shift) => {
            const textColor = getContrastingTextColor(shift.color);
            const timeSlotDisplay = timeSlots[shift.code] || "Nincs időpont"; // Default text if time slot missing

            return (
              <div
                key={shift.code}
                className="flex flex-col items-center p-2 rounded print:p-1 text-center"
                style={{
                  backgroundColor: shift.color || "#cccccc", // Default background if color missing
                  color: textColor,
                }}
                title={`${shift.name} (${timeSlotDisplay})`} // Tooltip showing full name and time
              >
                <div className="font-bold">{shift.code}</div>
                {timeSlots[shift.code] && ( // Only display time if it exists
                  <div className="text-xs opacity-90">
                    {timeSlots[shift.code]}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Message shown when no shift types are defined
          <div className="col-span-full py-4 text-center text-gray-500">
            Nincsenek műszaktípusok definiálva. Kattintson a 'Műszakok kezelése'
            gombra új műszakok hozzáadásához.
          </div>
        )}
      </div>

      {/* Modal for Editing Shift Types (Rendered conditionally) */}
      {showModal && (
        <ShiftTypesModal
          shiftTypes={shiftTypes}
          timeSlots={timeSlots}
          onSave={handleSaveShiftTypes}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Legend;

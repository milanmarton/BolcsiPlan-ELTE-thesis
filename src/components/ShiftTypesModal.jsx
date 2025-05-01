import React, { useState, useEffect } from "react";
import { Trash2, Plus, Edit2, X } from "lucide-react";

/**
 * @typedef {object} ShiftType - Defines the structure of a shift type object.
 * @property {string} code - The short code for the shift (e.g., "DE").
 * @property {string} name - The descriptive name of the shift (e.g., "Délelőtt").
 * @property {string} color - The hex color code associated with the shift (e.g., "#ffffff").
 */

/**
 * @typedef {object.<string, string>} TimeSlotsMap - An object mapping shift codes (string) to time slot descriptions (string).
 * @example
 * { "DE": "08:00-16:00", "DU": "12:00-20:00" }
 */

/**
 * @typedef {object} ShiftTypesModalProps
 * @property {Array<ShiftType>} [shiftTypes=[]] - The current array of shift type objects.
 * @property {TimeSlotsMap} [timeSlots={}] - The current object mapping shift codes to time slot strings.
 * @property {function(Array<ShiftType>, TimeSlotsMap): void} onSave - Callback function invoked when the user clicks the final save button. It receives the updated shifts array and times object.
 * @property {function(): void} onClose - Callback function invoked when the user closes the modal.
 */

/**
 * A modal component for managing shift types and their associated time slots.
 * Allows users to add, edit, and delete shift types. Changes are managed locally
 * within the modal and saved globally via the `onSave` callback.
 *
 * @param {ShiftTypesModalProps} props - The component props.
 * @returns {JSX.Element} The rendered modal component.
 */
const ShiftTypesModal = ({
  shiftTypes = [],
  timeSlots = {},
  onSave,
  onClose,
}) => {
  // ==========================================================================
  // State
  // ==========================================================================

  /**
   * @state {Array<object>} localShifts - Local copy of the shift types array for editing within the modal.
   */
  const [localShifts, setLocalShifts] = useState([...shiftTypes]);

  /**
   * @state {object} localTimes - Local copy of the time slots object for editing within the modal.
   */
  const [localTimes, setLocalTimes] = useState({ ...timeSlots });

  /**
   * @state {number | null} editingIndex - The index of the shift currently being edited in the `localShifts` array. Null if adding a new shift.
   */
  const [editingIndex, setEditingIndex] = useState(null);

  /**
   * @state {boolean} showForm - Controls the visibility of the add/edit form section.
   */
  const [showForm, setShowForm] = useState(false);

  /**
   * @state {object} editingShift - Holds the data for the shift currently being edited or added in the form.
   * @property {string} code - The shift code (e.g., "DE").
   * @property {string} name - The full name of the shift (e.g., "Délelőtt").
   * @property {string} color - The hex color code for the shift (e.g., "#ffffff").
   * @property {string} timeSlot - The associated time slot string (e.g., "08:00-16:00").
   */
  const [editingShift, setEditingShift] = useState({
    code: "",
    name: "",
    color: "#ffffff",
    timeSlot: "",
  });

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * @effect
   * Synchronizes the local state (`localShifts`, `localTimes`) with the incoming props
   * (`shiftTypes`, `timeSlots`) whenever the props change. This ensures the modal
   * reflects the most current data if it's updated in the background while the modal is open,
   * or when the modal is reopened.
   */
  useEffect(() => {
    setLocalShifts([...shiftTypes]);
    setLocalTimes({ ...timeSlots });
  }, [shiftTypes, timeSlots]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * @function handleEditShift
   * Prepares the form for editing an existing shift type by populating
   * the `editingShift` state with the data of the selected shift and setting the `editingIndex`.
   * @param {number} index - The index of the shift to edit in the `localShifts` array.
   */
  const handleEditShift = (index) => {
    const shift = localShifts[index];
    setEditingShift({
      code: shift.code,
      name: shift.name,
      color: shift.color,
      timeSlot: localTimes[shift.code] || "",
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  /**
   * @function handleAddShift
   * Prepares the form for adding a new shift type by resetting the
   * `editingShift` state and clearing the `editingIndex`.
   */
  const handleAddShift = () => {
    setEditingShift({ code: "", name: "", color: "#ffffff", timeSlot: "" });
    setEditingIndex(null);
    setShowForm(true);
  };

  /**
   * @function handleDeleteShift
   * Deletes a shift type from the local state (`localShifts` and `localTimes`)
   * after user confirmation.
   * @param {number} indexToDelete - The index of the shift to delete in the `localShifts` array.
   */
  const handleDeleteShift = (indexToDelete) => {
    if (
      window.confirm(
        "Biztosan törli ezt a műszaktípust? Ezt nem lehet visszavonni.",
      )
    ) {
      const shiftCodeToDelete = localShifts[indexToDelete].code;

      // Update local shifts array by filtering out the item at indexToDelete
      const newShifts = localShifts.filter(
        (_, index) => index !== indexToDelete,
      );
      setLocalShifts(newShifts);

      // Update local timeslots object if the deleted shift had an associated time
      if (localTimes[shiftCodeToDelete]) {
        const newTimes = { ...localTimes };
        delete newTimes[shiftCodeToDelete];
        setLocalTimes(newTimes);
      }
    }
  };

  /**
   * @function handleSaveShiftForm
   * Validates the data in the `editingShift` state and saves it to the
   * local state (`localShifts` and `localTimes`). Handles both adding new shifts and
   * updating existing ones. Resets the form state afterwards.
   */
  const handleSaveShiftForm = () => {
    // Basic validation
    if (!editingShift.code.trim()) return alert("Kód megadása kötelező!");
    if (!editingShift.name.trim()) return alert("Név megadása kötelező!");

    const code = editingShift.code.trim().toUpperCase();
    const name = editingShift.name.trim();
    const color = editingShift.color;
    const timeSlot = editingShift.timeSlot.trim();

    // Check for duplicate code locally, allowing save if editing the same item
    const isDuplicate = localShifts.some(
      (s, i) =>
        s.code.toLowerCase() === code.toLowerCase() && i !== editingIndex,
    );
    if (isDuplicate) return alert("Ez a műszak kód már létezik!");

    const newShifts = [...localShifts];
    const newTimes = { ...localTimes };

    if (editingIndex !== null) {
      // --- Editing existing shift ---
      const oldCode = localShifts[editingIndex].code;
      // If the code changed and the old code had a time slot, remove the old time slot entry
      if (oldCode !== code && newTimes[oldCode]) {
        delete newTimes[oldCode];
      }
      // Update the shift data in the array
      newShifts[editingIndex] = { code, name, color };
    } else {
      // --- Adding new shift ---
      newShifts.push({ code, name, color });
    }

    // Update the time slot associated with the (potentially new) code
    if (timeSlot) {
      newTimes[code] = timeSlot; // Add or update the time slot
    } else if (newTimes[code]) {
      delete newTimes[code]; // Remove the time slot if the input is now empty
    }

    // Update local state with the modified arrays/objects
    setLocalShifts(newShifts);
    setLocalTimes(newTimes);

    // Reset form state
    setShowForm(false);
    setEditingIndex(null);
    setEditingShift({ code: "", name: "", color: "#ffffff", timeSlot: "" });
  };

  /**
   * @function handleSaveAll
   * Triggers the `onSave` prop callback, passing the current local state
   * (`localShifts`, `localTimes`) up to the parent component for global saving.
   * Then, calls `onClose` to close the modal.
   */
  const handleSaveAll = () => {
    onSave(localShifts, localTimes);
    onClose();
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-types-modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 id="shift-types-modal-title" className="text-xl font-semibold">
            Műszakok és időpontok kezelése
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Bezárás"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-grow overflow-y-auto">
          {/* Add/Edit Form Section (Conditional) */}
          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">
                {editingIndex !== null
                  ? "Műszak szerkesztése"
                  : "Új műszak hozzáadása"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Shift Code Input */}
                <div>
                  <label
                    htmlFor="shift-code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Kód (max 4 karakter) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shift-code"
                    type="text"
                    value={editingShift.code}
                    onChange={(e) =>
                      setEditingShift({
                        ...editingShift,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full p-2 border rounded uppercase"
                    maxLength={4}
                    placeholder="pl. DE"
                    required
                    aria-required="true"
                  />
                </div>
                {/* Shift Name Input */}
                <div>
                  <label
                    htmlFor="shift-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Név <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shift-name"
                    type="text"
                    value={editingShift.name}
                    onChange={(e) =>
                      setEditingShift({ ...editingShift, name: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="pl. Délelőtt"
                    required
                    aria-required="true"
                  />
                </div>
                {/* Shift Color Input */}
                <div className="md:col-span-1">
                  <label
                    htmlFor="shift-color-picker"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Szín
                  </label>
                  <div className="flex items-center">
                    <input
                      id="shift-color-picker"
                      type="color"
                      value={editingShift.color}
                      onChange={(e) =>
                        setEditingShift({
                          ...editingShift,
                          color: e.target.value,
                        })
                      }
                      className="p-0 border rounded mr-2 h-10 w-10 cursor-pointer flex-shrink-0"
                      aria-label="Színválasztó"
                    />
                    <input
                      type="text"
                      value={editingShift.color}
                      onChange={(e) =>
                        setEditingShift({
                          ...editingShift,
                          color: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      placeholder="#ffffff"
                      aria-label="Szín hex kódja"
                    />
                  </div>
                </div>
                {/* Shift Time Slot Input */}
                <div>
                  <label
                    htmlFor="shift-timeslot"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Időpont (opcionális)
                  </label>
                  <input
                    id="shift-timeslot"
                    type="text"
                    value={editingShift.timeSlot}
                    onChange={(e) =>
                      setEditingShift({
                        ...editingShift,
                        timeSlot: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="pl. 6:30-13:50"
                  />
                </div>
              </div>
              {/* Form Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Mégsem
                </button>
                <button
                  type="button"
                  onClick={handleSaveShiftForm}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mentés
                </button>
              </div>
            </div>
          )}

          {/* List of Existing Shift Types */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Létező műszaktípusok listája
              </caption>
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="py-2 px-3 text-left border">
                    Kód
                  </th>
                  <th scope="col" className="py-2 px-3 text-left border">
                    Név
                  </th>
                  <th scope="col" className="py-2 px-3 text-left border">
                    Szín
                  </th>
                  <th scope="col" className="py-2 px-3 text-left border">
                    Időpont
                  </th>
                  <th scope="col" className="py-2 px-3 text-center border">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody>
                {localShifts.length > 0
                  ? localShifts.map((shift, index) => (
                      <tr
                        key={`${shift.code}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 border font-medium">
                          {shift.code}
                        </td>
                        <td className="py-2 px-3 border">{shift.name}</td>
                        <td className="py-2 px-3 border">
                          <div className="flex items-center">
                            <div
                              className="w-6 h-6 mr-2 rounded border flex-shrink-0"
                              style={{ backgroundColor: shift.color }}
                              aria-hidden="true"
                            ></div>
                            <span className="truncate">{shift.color}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 border">
                          {localTimes[shift.code] || "-"}
                        </td>
                        <td className="py-2 px-3 border text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEditShift(index)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title={`Szerkesztés: ${shift.name}`}
                              aria-label={`Szerkesztés: ${shift.name}`}
                            >
                              <Edit2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleDeleteShift(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title={`Törlés: ${shift.name}`}
                              aria-label={`Törlés: ${shift.name}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : // Show message if list is empty and form is not visible
                    !showForm && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-gray-500 border"
                        >
                          Nincsenek műszaktípusok definiálva.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>

          {/* Add New Shift Button (Conditional) */}
          {!showForm && (
            <div className="mt-4">
              <button
                onClick={handleAddShift}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                Új műszak hozzáadása
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Mégsem
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Változtatások mentése és bezárás
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftTypesModal;

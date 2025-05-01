import React from "react";
import { AlertCircle, Edit, Loader, UserX } from "lucide-react";
import {
  formatDate,
  getDayName,
  getContrastingTextColor,
} from "../utils/helpers";

/**
 * @typedef {object} ScheduleTableStaffMember - Represents a staff member's data within the ScheduleTable context.
 * @property {string} staffId - Unique identifier for the staff member.
 * @property {string} [employeeNumber] - Optional employee identifier number/code.
 * @property {string} displayUnit - The unit name to display (may include '(törölt)' if orphaned).
 * @property {boolean} isOrphanedUnit - Flag indicating if the assigned unit is no longer in global settings.
 * @property {string} displayGroup - The group name to display (may include '(törölt)' if orphaned).
 * @property {boolean} isOrphanedGroup - Flag indicating if the assigned group is no longer in global settings.
 * @property {string} displayJobTitle - The job title to display (may include '(törölt)' if orphaned).
 * @property {boolean} isOrphanedJobTitle - Flag indicating if the assigned job title is no longer in global settings.
 * @property {string} name - The staff member's name.
 * @property {object.<string, string>} [shifts] - An object mapping date strings ('YYYY-MM-DD') to shift codes for the week.
 */

/**
 * @typedef {object} StaffByUnit - Data structure grouping staff members by their assigned unit for the week.
 * @property {Array<ScheduleTableStaffMember>} [unitName] - An array of staff member objects belonging to the unit specified by the key 'unitName'.
 * @property {Array<ScheduleTableStaffMember>} [""] - An array of staff member objects not assigned to any unit for the week.
 */

/**
 * @typedef {object} ScheduleTableProps
 * @property {Array<Date>} weekDates - An array of Date objects representing the days of the week to display.
 * @property {StaffByUnit} staffByUnit - An object where keys are unit names (or empty string for unassigned)
 *                                     and values are arrays of staff objects belonging to that unit for the week.
 *                                     Staff objects include details, shifts, and potentially 'orphaned' flags.
 * @property {function(ScheduleTableStaffMember): void} handleEditStaff - Callback function triggered when the edit button for a staff member is clicked. Receives the staff object.
 * @property {function(string): void} handleDeleteStaff - Callback function triggered when the delete button for a staff member is clicked. Receives the staff ID.
 * @property {function(string): string} getShiftColor - Function to retrieve the background color for a given shift code. Receives the shift code string.
 * @property {object} [timeSlots={}] - An object mapping shift codes to their corresponding time slot strings (e.g., "07:00-15:00").
 * @property {boolean} isLoading - Flag indicating if the schedule data is currently being loaded.
 * @property {boolean} scheduleExists - Flag indicating if staff data exists for the table (set to false if loading fails or no staff are found).
 * @property {object} globalSettings - Object containing global application settings, including `units`, `groups`, `jobTitles`, and `shiftTypes`. Used for lookups and checking orphaned data.
 */

/**
 * Renders the main schedule table component.
 * Displays staff schedules grouped by unit for a given week.
 * Handles loading states, empty states, and displays shifts with appropriate colors.
 * Provides actions to edit or remove staff from the weekly schedule.
 * Highlights data (unit, group, job title) if the corresponding global setting has been deleted ("orphaned").
 *
 * @param {ScheduleTableProps} props - The component props.
 * @returns {JSX.Element} The rendered schedule table component.
 */
const ScheduleTable = ({
  weekDates,
  staffByUnit,
  handleEditStaff,
  handleDeleteStaff,
  getShiftColor,
  timeSlots = {},
  isLoading,
  scheduleExists,
  globalSettings,
}) => {
  // --- Rendering Functions ---

  /**
   * Renders a single table row (`<tr>`) for a staff member.
   * Displays staff details, shifts for the week, and action buttons.
   * Applies specific styling for "orphaned" unit, group, or job title data.
   *
   * @param {object} staff - The staff object containing details, shifts, and display values/flags.
   *                         Expected properties include: staffId, employeeNumber, displayUnit, isOrphanedUnit,
   *                         displayGroup, isOrphanedGroup, displayJobTitle, isOrphanedJobTitle, name, shifts.
   * @returns {JSX.Element} The rendered table row for the staff member.
   */
  const renderStaffRow = (staff) => {
    const rowKey = staff.staffId;
    const orphanStyle = "text-red-600 italic"; // Style for orphaned data

    return (
      <tr
        key={rowKey}
        className="bg-white hover:bg-gray-50 print:hover:bg-white"
      >
        {/* Employee Number Column */}
        <td
          className="py-1 px-1 print:py-0.5 print:px-0.5 text-center text-gray-700 text-sm align-middle"
          title={`Belső ID: ${staff.staffId}`}
        >
          {staff.employeeNumber || "-"}
        </td>
        {/* Unit Column */}
        <td
          className={`py-2 px-2 whitespace-nowrap print:py-1 print:px-1 text-sm align-middle ${
            staff.isOrphanedUnit ? orphanStyle : ""
          }`}
          title={
            staff.isOrphanedUnit
              ? "Ez az egység törölve lett a globális beállításokból"
              : ""
          }
        >
          {staff.displayUnit || "-"}
        </td>
        {/* Group Column */}
        <td
          className={`py-2 px-2 whitespace-nowrap print:py-1 print:px-1 text-sm align-middle ${
            staff.isOrphanedGroup ? orphanStyle : ""
          }`}
          title={
            staff.isOrphanedGroup
              ? "Ez a csoport törölve lett a globális beállításokból"
              : ""
          }
        >
          {staff.displayGroup || "-"}
        </td>
        {/* Job Title Column */}
        <td
          className={`py-2 px-2 whitespace-nowrap print:py-1 print:px-1 text-sm align-middle ${
            staff.isOrphanedJobTitle ? orphanStyle : ""
          }`}
          title={
            staff.isOrphanedJobTitle
              ? "Ez a munkakör törölve lett a globális beállításokból"
              : ""
          }
        >
          {staff.displayJobTitle || "-"}
        </td>
        {/* Name Column */}
        <td className="py-2 px-2 whitespace-nowrap font-medium print:py-1 print:px-1 text-sm align-middle">
          {staff.name || "N/A"}
        </td>

        {/* Daily Shift Columns */}
        {weekDates.map((date) => {
          const dateString = date.toISOString().split("T")[0];
          const shiftCode = staff.shifts?.[dateString] || "";
          const shiftTypeInfo = globalSettings?.shiftTypes?.find(
            (st) => st.code === shiftCode,
          );
          const timeSlot = timeSlots[shiftCode] || "";
          const bgColor = getShiftColor(shiftCode);
          const textColor = getContrastingTextColor(bgColor);

          return (
            <td
              key={`${rowKey}-${dateString}`}
              className="py-1 px-1 text-center whitespace-nowrap print:py-0.5 print:px-0.5 border-l border-gray-100 align-middle"
              style={{ backgroundColor: bgColor, color: textColor }}
              title={
                shiftTypeInfo?.name
                  ? `${shiftTypeInfo.name}${timeSlot ? ` (${timeSlot})` : ""}`
                  : timeSlot || "Nincs műszak"
              }
            >
              <div className="font-medium text-sm">{shiftCode}</div>
              {timeSlot && (
                <div
                  className="text-[10px] opacity-90 leading-tight"
                  style={{ color: textColor }}
                >
                  {timeSlot}
                </div>
              )}
              {!shiftCode && <div className="text-gray-300">-</div>}
            </td>
          );
        })}

        {/* Action Buttons Column (Hidden on Print) */}
        <td className="py-1 px-2 whitespace-nowrap text-center print:hidden align-middle">
          <div className="flex justify-center space-x-1">
            <button
              onClick={() => handleEditStaff(staff)}
              className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              title="Heti beosztás szerkesztése"
              aria-label={`Szerkesztés: ${staff.name || staff.staffId}`}
            >
              <Edit className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => handleDeleteStaff(staff.staffId)}
              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isLoading ||
                !staff.shifts ||
                Object.keys(staff.shifts).length === 0
              }
              title={
                !staff.shifts || Object.keys(staff.shifts).length === 0
                  ? "Dolgozó nincs hozzárendelve ehhez a héthez"
                  : "Eltávolítás a hétből"
              }
              aria-label={`Eltávolítás a hétből: ${staff.name || staff.staffId}`}
            >
              <UserX className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  /**
   * Renders a section for a specific unit, including a header row and
   * rows for each staff member in that unit.
   * Handles display for units that may have been deleted from global settings ("orphaned").
   *
   * @param {string} unitKey - The key representing the unit (or empty string for unassigned staff).
   * @param {Array<object>} staffList - Array of staff objects belonging to this unit.
   * @param {number} unitIndex - The index of this unit section in the overall list.
   * @returns {React.Fragment} A fragment containing the unit header and staff rows.
   */
  const renderUnitSection = (unitKey, staffList = [], unitIndex) => {
    // Check if the unit itself (not the staff's assigned unit) is orphaned
    const isUnitKeyOrphaned =
      unitKey !== "" &&
      globalSettings &&
      !globalSettings.units?.includes(unitKey);
    const displayUnitName = isUnitKeyOrphaned
      ? `${unitKey} (törölt)`
      : unitKey || "Nincs egységhez rendelve";

    return (
      <React.Fragment key={unitKey || "no-unit"}>
        {/* Unit Header Row */}
        <tr
          className={`print:bg-blue-100 sticky top-[49px] border-b border-gray-200 ${isUnitKeyOrphaned ? "bg-red-50" : "bg-blue-50"}`}
        >
          <th
            scope="col"
            colSpan={5 + weekDates.length + 1}
            className={`py-2 px-4 font-semibold print:py-1 print:px-2 text-sm align-middle ${isUnitKeyOrphaned ? "text-red-800" : "text-blue-800"}`}
            title={
              isUnitKeyOrphaned
                ? "Ez az egység törölve lett a globális beállításokból, de mentett heti adatok még használják."
                : ""
            }
          >
            {displayUnitName}
          </th>
        </tr>
        {/* Optional Spacer Row (for visual separation, hidden on print) p.s. without this it looked weird */}
        {unitIndex === 0 && (
          <tr className="h-2 bg-transparent print:hidden">
            <td
              colSpan={5 + weekDates.length + 1}
              className="p-0 border-none"
            ></td>
          </tr>
        )}
        {/* Staff Rows for this Unit */}
        {staffList.map(renderStaffRow)}
      </React.Fragment>
    );
  };

  // --- Table Body Content Logic ---

  let tableBodyContent;
  if (isLoading) {
    // Display Loader when data is loading
    tableBodyContent = (
      <tr role="status">
        <td
          colSpan={5 + weekDates.length + 1}
          className="py-10 text-center align-middle"
        >
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Loader
              className="w-8 h-8 mb-2 animate-spin text-blue-600"
              aria-hidden="true"
            />
            <p>Beosztás betöltése...</p>
          </div>
        </td>
      </tr>
    );
  } else if (!scheduleExists) {
    // Display Empty State if no schedule/staff data is available
    tableBodyContent = (
      <tr role="status">
        <td
          colSpan={5 + weekDates.length + 1}
          className="py-8 text-center text-gray-500 print:py-4 align-middle"
        >
          <div className="flex flex-col items-center justify-center">
            <AlertCircle
              className="w-8 h-8 mb-2 print:w-6 print:h-6"
              aria-hidden="true"
            />
            <p>
              Nincs aktív dolgozó a rendszerben, vagy nem sikerült betölteni
              őket.
            </p>
            <p className="text-sm mt-1">
              Ellenőrizze a Beállítások / Dolgozók menüpontot.
            </p>
          </div>
        </td>
      </tr>
    );
  } else {
    // Render Unit Sections with Staff Data
    // staffByUnit is expected to be pre-sorted if necessary before passing as prop
    tableBodyContent = (
      <>
        {Object.entries(staffByUnit).map(([unitKey, staffList], index) =>
          renderUnitSection(unitKey, staffList, index),
        )}
      </>
    );
  }

  // --- Component Return JSX ---

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto mb-6 print:shadow-none print:mb-2">
      <table className="min-w-full divide-y divide-gray-200 print:text-sm border-collapse table-fixed">
        {/* Sticky Table Header */}
        <thead className="sticky top-0 z-10 bg-gray-100 print:bg-gray-100">
          <tr>
            <th
              scope="col"
              className="py-2 px-1 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider print:py-1 print:px-0.5 w-[40px]"
            >
              Azon.
            </th>
            <th
              scope="col"
              className="py-2 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider print:py-1 print:px-1 w-[100px]"
            >
              Egység
            </th>
            <th
              scope="col"
              className="py-2 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider print:py-1 print:px-1 w-[120px]"
            >
              Csoport
            </th>
            <th
              scope="col"
              className="py-2 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider print:py-1 print:px-1 w-[100px]"
            >
              Munkakör
            </th>
            <th
              scope="col"
              className="py-2 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider print:py-1 print:px-1 w-[150px]"
            >
              Név
            </th>
            {weekDates.map((date, index) => (
              <th
                key={index}
                scope="col"
                className="py-1 px-1 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider print:py-0.5 print:px-0.5 border-l border-gray-200 w-[90px]"
              >
                <div>{getDayName(date)}</div>
                <div className="font-normal">{formatDate(date)}</div>
              </th>
            ))}
            <th
              scope="col"
              className="py-2 px-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider print:hidden border-l border-gray-200 w-[80px]"
            >
              Műveletek
            </th>
          </tr>
        </thead>
        {/* Table Body */}
        <tbody className="bg-white divide-y divide-gray-200">
          {tableBodyContent}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;

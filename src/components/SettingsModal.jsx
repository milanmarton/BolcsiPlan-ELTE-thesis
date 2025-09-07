import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Plus,
  GripVertical,
  X,
  Edit2,
  UserPlus,
  Users,
  Loader,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import StaffEditSubModal from "./StaffEditSubModal";

/**
 * @typedef {object} StaffMemberGlobal - Represents a staff member in the global list.
 * @property {string} id - Unique identifier.
 * @property {string} name - Staff member's name.
 * @property {string} [employeeNumber] - Optional employee identifier.
 * @property {string} [defaultUnit] - Default assigned unit.
 * @property {string} [defaultGroup] - Default assigned group.
 * @property {string} [defaultJobTitle] - Default assigned job title.
 * @property {boolean} isActive - Whether the staff member is active.
 * @property {number} sortOrder - Numerical order for sorting within lists.
 */

/**
 * @typedef {object} ShiftTypeGlobal - Represents a shift type definition.
 * @property {string} code - Short code for the shift (e.g., "DE").
 * @property {string} name - Full name of the shift (e.g., "Délelőtt").
 * @property {string} color - Hex color code for the shift background.
 */

/**
 * @typedef {object} GlobalSettingsData
 * @property {string[]} [units] - List of defined unit names.
 * @property {string[]} [groups] - List of defined group names.
 * @property {string[]} [jobTitles] - List of defined job title names.
 * @property {ShiftTypeGlobal[]} [shiftTypes] - List of defined shift types.
 * @property {object.<string, string>} [timeSlots] - Mapping of shift codes to time slot strings.
 * @property {StaffMemberGlobal[]} [staffList] - List of all staff members with their core data.
 */

/**
 * @typedef {object} SettingsModalProps
 * @property {GlobalSettingsData} globalSettings - Current settings from the main app state.
 * @property {GlobalSettingsData} demoGlobalSettings - Pre-defined demo data.
 * @property {boolean} settingsLoading - True if global settings are currently being loaded.
 * @property {function(GlobalSettingsData): Promise<boolean>} saveGlobalSettings - Main save function that updates the entire settings object at once. Returns true on success.
 * @property {function(string): Promise<boolean>} handleAddUnit - Callback to add a unit globally. Returns true on success.
 * @property {function(string): Promise<boolean>} handleRemoveUnit - Callback to remove a unit globally. Returns true on success.
 * @property {function(string): Promise<boolean>} handleAddGroup - Callback to add a group globally. Returns true on success.
 * @property {function(string): Promise<boolean>} handleRemoveGroup - Callback to remove a group globally. Returns true on success.
 * @property {function(string): Promise<boolean>} handleAddJobTitle - Callback to add a job title globally. Returns true on success.
 * @property {function(string): Promise<boolean>} handleRemoveJobTitle - Callback to remove a job title globally. Returns true on success.
 * @property {function(): void} onClose - Closes the modal without saving.
 */

/**
 * Modal for managing global application settings, including categories (units, groups, job titles),
 * and the staff list. Allows adding, removing, editing, and reordering items via drag-and-drop.
 * Provides options to save all changes using a unified save function or discard them.
 * Includes functionality to load demo data into the modal's local state for preview/setup.
 * Contains a sub-modal (`StaffEditSubModal`) for adding/editing individual staff members' core data.
 *
 * @param {SettingsModalProps} props - The component props.
 * @returns {JSX.Element} The rendered settings modal.
 */
const SettingsModal = ({
  globalSettings,
  demoGlobalSettings,
  settingsLoading,
  // Unified Save Function
  saveGlobalSettings,
  // Category Modifiers (Primarily for local UI updates)
  handleAddUnit,
  handleRemoveUnit,
  handleAddGroup,
  handleRemoveGroup,
  handleAddJobTitle,
  handleRemoveJobTitle,
  // Other needed prop(s)
  onClose,
}) => {
  // --- State ---
  const [activeTab, setActiveTab] = useState("categories"); // Controls the active tab ('categories' or 'staff')
  const [isSaving, setIsSaving] = useState(false); // Tracks if a save operation is in progress
  const [saveError, setSaveError] = useState(""); // Stores error messages from save operations

  // Local state for category add inputs
  const [newUnit, setNewUnit] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");

  // Local copies of global settings for editing within the modal
  const [units, setUnits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [localShiftTypes, setLocalShiftTypes] = useState([]);
  const [localTimeSlots, setLocalTimeSlots] = useState({});
  const [staffList, setStaffList] = useState([]); // Local copy of the staff list for editing and reordering

  // Track if modal was opened during loading to prevent accidental saves
  const [openedDuringLoading, setOpenedDuringLoading] = useState(false);

  // State for the staff edit/add sub-modal
  const [showStaffEditModal, setShowStaffEditModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState(null); // Holds staff data for the sub-modal, null if adding

  // State for drag and drop operations
  const [draggedItem, setDraggedItem] = useState(null); // The item being dragged
  const [draggedListType, setDraggedListType] = useState(null); // The type ('units', 'groups', 'jobTitles', 'staff') of the list the dragged item belongs to
  const [dragOverIndex, setDragOverIndex] = useState(null); // The index over which an item is being dragged

  // --- Effects ---

  /**
   * @effect
   * Updates the local state (units, groups, jobTitles, staffList, shifts, timeSlots)
   * whenever the `globalSettings` prop changes. This ensures the modal reflects the
   * latest global state when opened or when the global state updates in the background.
   * Creates deep copies to prevent direct mutation of the prop.
   * Sorts the initial local staff list based on `sortOrder`.
   */
  useEffect(() => {
    // Track if modal was opened while settings were still loading
    if (settingsLoading) {
      setOpenedDuringLoading(true);
    } else if (!settingsLoading && globalSettings) {
      // Reset flag when settings have loaded and modal reopens properly
      setOpenedDuringLoading(false);
    }

    setUnits([...(globalSettings?.units || [])]);
    setGroups([...(globalSettings?.groups || [])]);
    setJobTitles([...(globalSettings?.jobTitles || [])]);
    const sortedStaff = [...(globalSettings?.staffList || [])]
      .map((s) => ({ ...s })) // Deep copy staff objects
      .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
    setStaffList(sortedStaff);

    setLocalShiftTypes([...(globalSettings?.shiftTypes || [])]);
    setLocalTimeSlots({ ...(globalSettings?.timeSlots || {}) });
  }, [globalSettings, settingsLoading]);

  // --- Callbacks ---

  /**
   * @callback getListInfo
   * Returns an object containing the state list, setter function,
   * ID field name (if applicable), and default field name based on the provided list type string.
   * Used by drag/drop and category management functions.
   * Memoized to avoid unnecessary re-creation.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of list to get information for.
   * @returns {{ list: any[], setList: Function, idField: string|null, defaultField: string|null } | null} An object with list state, setter, ID field, default field, or null if type is invalid.
   */
  const getListInfo = useCallback(
    (listType) => {
      switch (listType) {
        case "units":
          return {
            list: units,
            setList: setUnits,
            idField: null,
            defaultField: "defaultUnit",
          };
        case "groups":
          return {
            list: groups,
            setList: setGroups,
            idField: null,
            defaultField: "defaultGroup",
          };
        case "jobTitles":
          return {
            list: jobTitles,
            setList: setJobTitles,
            idField: null,
            defaultField: "defaultJobTitle",
          };
        case "staff":
          return {
            list: staffList,
            setList: setStaffList,
            idField: "id",
            defaultField: null,
          };
        default:
          return null;
      }
    },
    [units, groups, jobTitles, staffList],
  );

  // --- Category Handlers (Operate on Local State) ---

  /**
   * @function addCategoryLocal
   * Adds a new item to a local category list (units, groups, jobTitles) if it's not empty and doesn't already exist (case-insensitive).
   * Updates the local state list and clears the input field.
   * @param {string} newItem - The new category item string to add.
   * @param {string[]} currentLocalList - The current local state array for the category.
   * @param {Function} setLocalList - The state setter function for the local category list.
   * @param {Function} setNewItemInput - The state setter function for the corresponding input field.
   * @param {string} categoryNameSingular - The singular name of the category (e.g., 'egység') for alert messages.
   */
  const addCategoryLocal = (
    newItem,
    currentLocalList,
    setLocalList,
    setNewItemInput,
    categoryNameSingular,
  ) => {
    const trimmedItem = newItem.trim();
    if (!trimmedItem) return;
    if (
      currentLocalList.some(
        (item) => item.toLowerCase() === trimmedItem.toLowerCase(),
      )
    ) {
      alert(`Ez a(z) ${categoryNameSingular} már létezik a listában!`);
      return;
    }
    setLocalList([...currentLocalList, trimmedItem]);
    setNewItemInput("");
  };

  /**
   * @function removeCategoryLocal
   * Removes an item from a local category list after confirmation.
   * Shows an additional warning if the item is used as a default by any active staff member in the global settings.
   * Updates the local state list.
   * @param {string} itemToRemove - The category item string to remove.
   * @param {string[]} currentLocalList - The current local state array for the category.
   * @param {Function} setLocalList - The state setter function for the local category list.
   * @param {'units' | 'groups' | 'jobTitles'} listType - The type of category list being modified.
   */
  const removeCategoryLocal = (
    itemToRemove,
    currentLocalList,
    setLocalList,
    listType,
  ) => {
    const listInfo = getListInfo(listType);
    if (!listInfo) return;
    const { defaultField } = listInfo;
    const staffUsingDefault =
      defaultField &&
      globalSettings?.staffList?.some(
        (staff) => staff.isActive && staff[defaultField] === itemToRemove,
      );
    let confirmMessage = `Biztosan törli "${itemToRemove}" elemet a listából? Mentéskor ez véglegesen törlődik.`;
    if (staffUsingDefault) {
      confirmMessage += `\nFigyelem: Ezt az értéket legalább egy aktív dolgozó alapértelmezettként használja!`;
    }
    if (window.confirm(confirmMessage)) {
      setLocalList(currentLocalList.filter((item) => item !== itemToRemove));
    }
  };

  // --- Staff Handlers (Operate on Local State & Sub-Modal) ---

  /**
   * @function handleAddNewStaff
   * Opens the StaffEditSubModal in 'add' mode by setting `editingStaffMember` to null.
   */
  const handleAddNewStaff = () => {
    setEditingStaffMember(null);
    setShowStaffEditModal(true);
  };

  /**
   * @function handleEditStaffMember
   * Opens the StaffEditSubModal in 'edit' mode, passing a copy of the selected staff member's data.
   * @param {object} staffMember - The staff member object from the local `staffList` state.
   */
  const handleEditStaffMember = (staffMember) => {
    setEditingStaffMember({ ...staffMember });
    setShowStaffEditModal(true);
  };

  /**
   * @function handleDeleteStaffMember
   * Removes a staff member from the local `staffList` state after confirmation.
   * Recalculates `sortOrder` for the remaining staff in the local list.
   * @param {string} staffId - The ID of the staff member to remove.
   */
  const handleDeleteStaffMember = (staffId) => {
    const staffMember = staffList.find((s) => s.id === staffId);
    if (!staffMember) return;
    const azonositoPart = staffMember.employeeNumber
      ? ` (Azon: ${staffMember.employeeNumber})`
      : "";
    const confirmMessage = `Biztosan törli "${staffMember.name}${azonositoPart}" dolgozót a törzsadatból? \nEzt a műveletet MENTÉSKOR véglegesítjük, és nem lehet visszavonni.`;
    if (window.confirm(confirmMessage)) {
      const updatedList = staffList.filter((s) => s.id !== staffId);
      const reorderedList = updatedList.map((staff, index) => ({
        ...staff,
        sortOrder: index,
      }));
      setStaffList(reorderedList); // Update local state
    }
  };

  /**
   * @function handleSaveStaffSubModal
   *  Callback function passed to `StaffEditSubModal`. Updates the local `staffList` state
   * when a staff member is added or edited in the sub-modal. Handles both adding new staff
   * and updating existing ones. Re-calculates sort order after update.
   * Closes the sub-modal.
   * @param {object} savedStaffData - The saved staff data object from the sub-modal.
   */
  const handleSaveStaffSubModal = (savedStaffData) => {
    let updatedList;
    const isEditingExisting = staffList.some((s) => s.id === savedStaffData.id);

    if (isEditingExisting) {
      // Update existing staff member
      updatedList = staffList.map((staff) =>
        staff.id === savedStaffData.id ? { ...savedStaffData } : staff,
      );
    } else {
      // Add new staff member (assign initial sortOrder based on current list length)
      const newStaffWithOrder = {
        ...savedStaffData,
        sortOrder: staffList.length,
      };
      updatedList = [...staffList, newStaffWithOrder];
    }

    // Recalculate sortOrder for the entire list based on current array index
    const reorderedList = updatedList.map((staff, index) => ({
      ...staff,
      sortOrder: index,
    }));

    setStaffList(reorderedList); // Update local state
    setShowStaffEditModal(false);
    setEditingStaffMember(null);
  };

  // --- Drag and Drop Handlers (Operate on Local State) ---

  /**
   * @function handleDragStart
   * Initiates a drag operation. Stores the dragged item and its list type in state.
   * Sets the drag effect and styles the dragged element.
   * @param {React.DragEvent<HTMLLIElement>} e - The drag event.
   * @param {object|string} item - The category string or staff object being dragged.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of list the item belongs to.
   */
  const handleDragStart = (e, item, listType) => {
    setDraggedItem(item);
    setDraggedListType(listType);
    e.dataTransfer.effectAllowed = "move";
    // Accessing currentTarget safely
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.6";
    }
  };

  /**
   * @function handleDragEnd
   * Cleans up after a drag operation ends (whether dropped successfully or cancelled).
   * Resets drag-related state and restores the element's opacity.
   * @param {React.DragEvent<HTMLLIElement>} e - The drag event.
   */
  const handleDragEnd = (e) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedItem(null);
    setDraggedListType(null);
    setDragOverIndex(null);
  };

  /**
   * @function handleDragOver
   * Handles the drag-over event on a potential drop target (list item).
   * Prevents default behavior to allow dropping. Sets the `dragOverIndex` state
   * if the dragged item belongs to the same list type. Sets the appropriate drop effect.
   * @param {React.DragEvent<HTMLLIElement|HTMLUListElement>} e - The drag event.
   * @param {number} index - The index of the item being dragged over.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of the list being dragged over.
   */
  const handleDragOver = (e, index, listType) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedListType === listType) {
      setDragOverIndex(index);
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none"; // Prevent dropping between different list types
    }
  };

  /**
   * @function handleDragLeave
   * Resets the `dragOverIndex` when the dragged item leaves a potential drop target's boundary.
   * Checks if the mouse is moving to an element outside the current list container or leaves the window.
   * @param {React.DragEvent<HTMLLIElement|HTMLUListElement>} e - The drag event.
   */
  const handleDragLeave = (e) => {
    const listContainer = e.currentTarget.closest("ul");
    // Reset if the related target is null (left window) OR
    // if there's a container and the related target is not inside it.
    // Use type guard EventTarget for contains method compatibility in JS
    if (
      !e.relatedTarget ||
      (listContainer &&
        e.relatedTarget instanceof EventTarget &&
        !listContainer.contains(e.relatedTarget))
    ) {
      setDragOverIndex(null);
    }
  };

  /**
   * @function handleDrop
   * Handles the drop event on a list item (target).
   * Reorders the items in the corresponding local state list.
   * Updates `sortOrder` for staff members if the list type is 'staff'.
   * Resets drag-related state.
   * @param {React.DragEvent<HTMLLIElement|HTMLUListElement>} e - The drop event.
   * @param {number} targetIndex - The index where the item is being dropped.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of list where the drop occurred.
   */
  const handleDrop = (e, targetIndex, listType) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    if (!draggedItem || draggedListType !== listType) {
      setDragOverIndex(null);
      return;
    }

    const listInfo = getListInfo(listType);
    if (!listInfo) {
      setDragOverIndex(null);
      return;
    }

    const { list: currentList, setList, idField } = listInfo;

    // Find the index of the item being dragged
    const draggedItemIndex = currentList.findIndex((item) =>
      // Use optional chaining for safety if item is not an object
      idField
        ? item?.[idField] === draggedItem?.[idField]
        : item === draggedItem,
    );

    // If item not found or dropped on itself, reset and exit
    if (draggedItemIndex === -1 || draggedItemIndex === targetIndex) {
      setDragOverIndex(null);
      if (
        e.currentTarget instanceof HTMLElement &&
        draggedItemIndex === targetIndex
      ) {
        e.currentTarget.style.opacity = "1"; // Restore opacity if dropped on self
      }
      setDraggedItem(null);
      setDraggedListType(null);
      return;
    }

    // Perform the reorder
    const currentListCopy = [...currentList];
    const [movedItem] = currentListCopy.splice(draggedItemIndex, 1);

    // Adjust target index if dragging downwards
    const insertAtIndex =
      draggedItemIndex < targetIndex ? targetIndex - 1 : targetIndex;

    // Ensure the insert index is within valid bounds
    const finalInsertIndex = Math.max(
      0,
      Math.min(insertAtIndex, currentListCopy.length),
    );

    currentListCopy.splice(finalInsertIndex, 0, movedItem);

    // Update state, recalculating sortOrder for staff
    if (listType === "staff") {
      const reorderedList = currentListCopy.map((staff, idx) => ({
        ...staff,
        sortOrder: idx,
      }));
      setList(reorderedList);
    } else {
      setList(currentListCopy);
    }

    setDragOverIndex(null); // Reset visual cue
  };

  /**
   * @function handleDropList
   * Handles dropping an item onto the list container itself (effectively dropping at the end).
   * @param {React.DragEvent<HTMLUListElement>} e - The drop event.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of list where the drop occurred.
   */
  const handleDropList = (e, listType) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedListType !== listType) {
      setDragOverIndex(null);
      return;
    }
    const listInfo = getListInfo(listType);
    if (listInfo) {
      // Call handleDrop with the index set to the end of the list
      handleDrop(e, listInfo.list.length, listType);
    }
  };

  // --- Save & Modal Control Handlers ---

  /**
   * @async
   * @function saveChanges
   * Saves all the changes made in the settings modal. Compares what's in the modal now
   * with what was there originally when it opened. If anything changed, it builds a complete new
   * settings object with everything (units, groups, job titles, shift types, time slots, staff list).
   * Then it calls the main save function to update everything at once. Shows a loading spinner while
   * saving and error messages if something goes wrong. If save succeeds or if nothing changed, it
   * just closes the modal.
   */
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError("");
    console.log("Starting unified saveChanges...");

    if (!globalSettings || !saveGlobalSettings) {
      console.error(
        "Save attempt failed: globalSettings or saveGlobalSettings is missing.",
      );
      setSaveError("Hiba: Mentési funkció vagy alapbeállítások hiányoznak.");
      setIsSaving(false);
      return;
    }

    // Prevent saving if modal was opened during loading to avoid overwriting with empty data
    if (openedDuringLoading) {
      console.error(
        "Save attempt blocked: Modal was opened while settings were still loading.",
      );
      setSaveError(
        "A beállítások még betöltés alatt voltak amikor a modal megnyílt. A biztonság érdekében a mentés letiltva. Kérjük zárja be ezt az ablakot és nyissa meg újra.",
      );
      setIsSaving(false);
      return;
    }

    try {
      // --- Get Original Data (ensure defaults) ---
      const originalUnits = globalSettings.units || [];
      const originalGroups = globalSettings.groups || [];
      const originalJobTitles = globalSettings.jobTitles || [];
      const originalShiftTypes = globalSettings.shiftTypes || [];
      const originalTimeSlots = globalSettings.timeSlots || {};
      const originalStaffListSorted = (globalSettings.staffList || [])
        .map((s) => ({ ...s })) // Create copies
        .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity))
        .map((staff, index) => ({ ...staff, sortOrder: index }));

      // --- Get Final Local Data (ensure staff list order is normalized) ---
      const finalLocalStaffList = staffList.map((staff, index) => ({
        ...staff,
        sortOrder: index,
      }));
      const finalLocalShiftTypes = localShiftTypes.map((s) => ({ ...s })); // Copy
      const finalLocalTimeSlots = { ...localTimeSlots }; // Copy

      // --- Check for Changes ---
      const categoriesChanged =
        JSON.stringify(units) !== JSON.stringify(originalUnits) ||
        JSON.stringify(groups) !== JSON.stringify(originalGroups) ||
        JSON.stringify(jobTitles) !== JSON.stringify(originalJobTitles);

      const staffListChanged =
        JSON.stringify(finalLocalStaffList) !==
        JSON.stringify(originalStaffListSorted);

      const shiftsChanged =
        JSON.stringify(finalLocalShiftTypes) !==
          JSON.stringify(originalShiftTypes) ||
        JSON.stringify(finalLocalTimeSlots) !==
          JSON.stringify(originalTimeSlots);

      // --- Determine if ANY change occurred ---
      const anyChanges = categoriesChanged || staffListChanged || shiftsChanged;

      if (anyChanges) {
        console.log("Changes detected. Constructing new settings object.");
        // Construct the NEW settings object based on the full local state
        const newSettingsToSave = {
          units: units, // Use local state
          groups: groups, // Use local state
          jobTitles: jobTitles, // Use local state
          shiftTypes: finalLocalShiftTypes, // Use local state
          timeSlots: finalLocalTimeSlots, // Use local state
          staffList: finalLocalStaffList, // Use local state (already sorted)
        };

        console.log("Calling saveGlobalSettings with:", newSettingsToSave);
        // Call the save function from the hook
        const success = await saveGlobalSettings(newSettingsToSave);

        if (success) {
          console.log("Global settings saved successfully via unified call.");
          onClose(); // Close modal on successful save
        } else {
          // saveGlobalSettings should set saveError in the hook if it fails
          console.error("Unified saveGlobalSettings call failed.");
          // Keep modal open, error should be displayed via saveError state from hook
          setSaveError(
            saveError || "Mentés sikertelen. Ellenőrizze a kapcsolatot.",
          ); // Provide a fallback error
        }
      } else {
        console.log("No changes detected, closing modal.");
        onClose(); // Close if no changes were made
      }
    } catch (error) {
      console.error("Error during unified saveChanges:", error);
      setSaveError(error.message || "Ismeretlen hiba történt a mentés során.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * @function handleLoadDemoData
   * Loads the `demoGlobalSettings` into the modal's local state,
   * overwriting any unsaved changes currently in the modal after confirmation.
   * Resets input fields and errors.
   */
  const handleLoadDemoData = () => {
    if (!demoGlobalSettings) {
      alert("Demó adatok nem elérhetők.");
      return;
    }

    if (
      !window.confirm(
        "Biztosan betölti a demó adatokat? \nEz felülírja a jelenlegi NEM MENTETT beállításokat ebben az ablakban!",
      )
    ) {
      return;
    }

    // Update LOCAL state with demo data
    setUnits([...(demoGlobalSettings.units || [])]);
    setGroups([...(demoGlobalSettings.groups || [])]);
    setJobTitles([...(demoGlobalSettings.jobTitles || [])]);
    setLocalShiftTypes([...(demoGlobalSettings.shiftTypes || [])]);
    setLocalTimeSlots({ ...(demoGlobalSettings.timeSlots || {}) });

    // Ensure demo staff list is sorted correctly before setting local state
    const sortedDemoStaff = [...(demoGlobalSettings.staffList || [])]
      .map((s) => ({ ...s })) // Create copies
      .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
    setStaffList(sortedDemoStaff);

    // Reset add inputs and error message
    setNewUnit("");
    setNewGroup("");
    setNewJobTitle("");
    setSaveError("");

    alert(
      "Demó adatok betöltve a szerkesztőbe. A végleges mentéshez kattintson a 'Változtatások mentése' gombra.",
    );
  };

  // --- Rendering Helpers ---

  /**
   * @function renderDraggableItem
   * Renders a single list item (`<li>`) for categories or staff, making it draggable.
   * Includes display text, drag handle, edit/delete buttons (conditionally).
   * Applies styling based on drag state (dragging, being dragged over) and staff active status.
   * Relies on JavaScript's dynamic typing and optional chaining.
   * @param {string|object} item - The category string or staff object.
   * @param {number} index - The index of the item in its list.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of list the item belongs to.
   * @param {Function} removeFunc - The function to call when the delete button is clicked (e.g., `removeCategoryLocal`, `handleDeleteStaffMember`).
   * @param {Function | null} editFunc - The function to call when the edit button is clicked (only for staff, e.g., `handleEditStaffMember`). Null for categories.
   * @returns {JSX.Element} The rendered draggable list item.
   */
  const renderDraggableItem = (item, index, listType, removeFunc, editFunc) => {
    const isStaff = listType === "staff";
    const staffItem = isStaff ? item : null;
    const categoryItem = !isStaff ? item : null;

    const azonositoPart = staffItem?.employeeNumber
      ? ` (Azon: ${staffItem.employeeNumber})`
      : "";
    const displayValue = isStaff
      ? `${staffItem?.name}${azonositoPart}`
      : categoryItem;
    const itemId = isStaff ? staffItem?.id : categoryItem; // Use ID for staff, string itself for category

    // Tooltip information
    const defaultInfo = isStaff
      ? `Alapértelmezett: ${staffItem?.defaultUnit || "-"} / ${staffItem?.defaultGroup || "-"} / ${staffItem?.defaultJobTitle || "-"} | Aktív: ${staffItem?.isActive ? "Igen" : "Nem"}`
      : "";
    const tooltipTitle = isStaff
      ? `Belső ID: ${staffItem?.id || "N/A"} | ${defaultInfo}`
      : `Kategória: ${categoryItem}`;

    // Drag state styling
    // Use optional chaining on draggedItem if it might be null/undefined during checks
    const isBeingDraggedOver =
      dragOverIndex === index && draggedListType === listType;
    const isDragging =
      draggedListType === listType &&
      (isStaff
        ? draggedItem?.id === staffItem?.id
        : draggedItem === categoryItem);

    // Conditional classes
    const liClasses = [
      "flex justify-between items-center bg-white p-2 border mb-1 rounded shadow-sm group cursor-grab active:cursor-grabbing transition-all duration-150 ease-in-out list-none",
      isStaff && !staffItem?.isActive ? "opacity-60 bg-gray-100" : "",
      isBeingDraggedOver && !isDragging
        ? "border-blue-500 ring-2 ring-blue-300"
        : "border-gray-200",
      isDragging ? "opacity-30 border-blue-400" : "",
    ]
      .filter(Boolean)
      .join(" "); // Filter out empty strings and join

    return (
      <li
        key={`${listType}-${itemId}`}
        draggable
        onDragStart={(e) => handleDragStart(e, item, listType)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index, listType)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index, listType)}
        className={liClasses}
        title={tooltipTitle}
      >
        {/* Left side: Drag handle and display value */}
        <div className="flex items-center flex-grow mr-2 overflow-hidden">
          <GripVertical
            className="w-5 h-5 mr-2 text-gray-400 group-hover:text-gray-600 flex-shrink-0 cursor-grab"
            aria-hidden="true"
          />
          <span className="truncate text-sm">{displayValue}</span>
          {isStaff && !staffItem?.isActive && (
            <span className="ml-2 text-xs text-red-600 font-semibold">
              (Inaktív)
            </span>
          )}
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center flex-shrink-0 space-x-1">
          {editFunc && isStaff && (
            <button
              onClick={() => editFunc(staffItem)} // Pass staffItem object
              className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100"
              title="Szerkesztés"
              disabled={isSaving}
              aria-label={`Szerkesztés: ${displayValue}`}
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            // Pass the correct identifier (itemId) to the remove function
            onClick={() => removeFunc(itemId, listType)}
            className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100"
            title="Törlés a listából"
            disabled={isSaving}
            aria-label={`Törlés: ${displayValue}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  };

  /**
   * @function renderListSection
   * Renders a complete section for a category or the staff list.
   * Includes a title, an optional component for adding new items (for categories),
   * and a scrollable, droppable list (`<ul>`) containing the draggable items.
   * Handles the display of an empty list message.
   * @param {string} title - The title for the list section.
   * @param {Array<string|object>} localList - The local state array for this list.
   * @param {'units' | 'groups' | 'jobTitles' | 'staff'} listType - The type of list.
   * @param {Function} renderItemFunc - The function used to render each item (should be `renderDraggableItem`).
   * @param {JSX.Element | null} [addItemComponent=null] - Optional JSX element for adding new items (used for categories).
   * @returns {JSX.Element | null} The rendered list section, or null if listType is invalid.
   */
  const renderListSection = (
    title,
    localList = [], // Default to empty array
    listType,
    renderItemFunc,
    addItemComponent = null,
  ) => {
    const listInfo = getListInfo(listType);
    if (!listInfo) return null; // Should not happen with correct usage

    // Style for the drop zone at the very end of the list
    const endDropZoneStyle =
      dragOverIndex === localList.length && draggedListType === listType
        ? "border-2 border-dashed border-blue-400 rounded bg-blue-50 pt-2 pb-2" // Highlight when dragging over end
        : "border-2 border-dashed border-transparent"; // Transparent border otherwise

    return (
      <div className="flex flex-col h-full">
        {/* Section Title */}
        {title && (
          <h3 className="font-semibold mb-2 text-center text-base flex-shrink-0">
            {title}
          </h3>
        )}

        {/* Optional Add Item Component (for categories) */}
        {addItemComponent}

        {/* List Container */}
        <div className="bg-gray-100 p-3 rounded border border-gray-300 flex-grow overflow-y-auto min-h-[300px] relative">
          <p className="text-xs text-gray-500 mb-2 text-center italic">
            Sorrend húzással módosítható.
          </p>

          {/* Empty List Message */}
          {localList.length === 0 &&
            !draggedItem && ( // Show only if list is empty AND nothing is being dragged
              <p className="text-gray-500 text-sm text-center mt-4">
                Lista üres.
              </p>
            )}

          {/* Unordered List - Drop Target & Item Container */}
          <ul
            onDragOver={(e) => handleDragOver(e, localList.length, listType)} // Handle dragging over the end
            onDrop={(e) => handleDropList(e, listType)} // Handle dropping at the end
            onDragLeave={handleDragLeave}
            // Apply dynamic style for end drop zone visualization
            className={`min-h-[50px] space-y-1 list-none p-0 m-0 ${endDropZoneStyle} transition-colors duration-150`}
            aria-label={`${title || listType} lista`}
          >
            {/* Render List Items */}
            {localList.map(
              (item, index) => renderItemFunc(item, index, listType), // Call the passed render function
            )}
            {/* The empty space below the items acts as the drop zone for the end */}
          </ul>
        </div>
      </div>
    );
  };

  // --- Main Modal Render ---
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-3 border-b bg-white flex justify-between items-center flex-shrink-0 rounded-t-lg">
          <h2 id="settings-modal-title" className="text-xl font-semibold">
            Beállítások
          </h2>
          {/* Tabs */}
          <div
            className="flex space-x-1 border border-gray-300 rounded p-0.5 bg-gray-100"
            role="tablist"
            aria-orientation="horizontal"
          >
            <button
              id="tab-categories"
              role="tab"
              aria-selected={activeTab === "categories"}
              aria-controls="panel-categories"
              onClick={() => setActiveTab("categories")}
              className={`px-3 py-1 rounded text-sm flex items-center transition-colors duration-150 ${activeTab === "categories" ? "bg-white text-blue-700 shadow" : "text-gray-600 hover:text-blue-700"}`}
            >
              <Users className="w-4 h-4 mr-1.5" aria-hidden="true" /> Kategóriák
            </button>
            <button
              id="tab-staff"
              role="tab"
              aria-selected={activeTab === "staff"}
              aria-controls="panel-staff"
              onClick={() => setActiveTab("staff")}
              className={`px-3 py-1 rounded text-sm flex items-center transition-colors duration-150 ${activeTab === "staff" ? "bg-white text-blue-700 shadow" : "text-gray-600 hover:text-blue-700"}`}
            >
              <UserPlus className="w-4 h-4 mr-1.5" aria-hidden="true" />{" "}
              Dolgozók
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Bezárás (nem mentett változások elvesznek)"
            aria-label="Beállítások ablak bezárása"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 flex-grow overflow-y-auto">
          {/* Categories Tab Panel */}
          {activeTab === "categories" && (
            <div
              id="panel-categories"
              role="tabpanel"
              aria-labelledby="tab-categories"
              className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full"
            >
              {/* Render Unit List */}
              {renderListSection(
                "Egységek",
                units,
                "units",
                // Render function for each item
                (item, index, listType) =>
                  renderDraggableItem(
                    item,
                    index,
                    listType,
                    (itemId) =>
                      removeCategoryLocal(itemId, units, setUnits, listType), // Remove func
                    null, // No edit func for categories
                  ),
                // Add Item component for Units
                <div className="mb-4 flex flex-shrink-0">
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Új egység neve..."
                    className="flex-grow p-2 border rounded-l text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    aria-label="Új egység hozzáadása"
                  />
                  <button
                    onClick={() =>
                      addCategoryLocal(
                        newUnit,
                        units,
                        setUnits,
                        setNewUnit,
                        "egység",
                      )
                    }
                    className="px-3 py-2 bg-green-600 text-white rounded-r hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                    disabled={isSaving}
                    aria-label="Egység hozzáadása"
                    title="Egység hozzáadása"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>,
              )}
              {/* Render Group List */}
              {renderListSection(
                "Csoportok",
                groups,
                "groups",
                (item, index, listType) =>
                  renderDraggableItem(
                    item,
                    index,
                    listType,
                    (itemId) =>
                      removeCategoryLocal(itemId, groups, setGroups, listType),
                    null,
                  ),
                <div className="mb-4 flex flex-shrink-0">
                  <input
                    type="text"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="Új csoport neve..."
                    className="flex-grow p-2 border rounded-l text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    aria-label="Új csoport hozzáadása"
                  />
                  <button
                    onClick={() =>
                      addCategoryLocal(
                        newGroup,
                        groups,
                        setGroups,
                        setNewGroup,
                        "csoport",
                      )
                    }
                    className="px-3 py-2 bg-green-600 text-white rounded-r hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                    disabled={isSaving}
                    aria-label="Csoport hozzáadása"
                    title="Csoport hozzáadása"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>,
              )}
              {/* Render Job Title List */}
              {renderListSection(
                "Munkakörök",
                jobTitles,
                "jobTitles",
                (item, index, listType) =>
                  renderDraggableItem(
                    item,
                    index,
                    listType,
                    (itemId) =>
                      removeCategoryLocal(
                        itemId,
                        jobTitles,
                        setJobTitles,
                        listType,
                      ),
                    null,
                  ),
                <div className="mb-4 flex flex-shrink-0">
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="Új munkakör neve..."
                    className="flex-grow p-2 border rounded-l text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    aria-label="Új munkakör hozzáadása"
                  />
                  <button
                    onClick={() =>
                      addCategoryLocal(
                        newJobTitle,
                        jobTitles,
                        setJobTitles,
                        setNewJobTitle,
                        "munkakör",
                      )
                    }
                    className="px-3 py-2 bg-green-600 text-white rounded-r hover:bg-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                    disabled={isSaving}
                    aria-label="Munkakör hozzáadása"
                    title="Munkakör hozzáadása"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>,
              )}
            </div>
          )}

          {/* Staff Tab Panel */}
          {activeTab === "staff" && (
            <div
              id="panel-staff"
              role="tabpanel"
              aria-labelledby="tab-staff"
              className="h-full flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold">Dolgozók Törzsadatok</h3>
                <button
                  onClick={handleAddNewStaff}
                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                  disabled={isSaving}
                >
                  <UserPlus className="w-4 h-4 mr-1" aria-hidden="true" /> Új
                  dolgozó
                </button>
              </div>
              {/* Render Staff List */}
              {renderListSection(
                "", // No main title needed here as it's above
                staffList,
                "staff",
                (item, index, listType) =>
                  renderDraggableItem(
                    item,
                    index,
                    listType,
                    handleDeleteStaffMember, // Remove func
                    handleEditStaffMember, // Edit func
                  ),
                null, // No inline add component for staff
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t bg-white relative flex-shrink-0 rounded-b-lg">
          {/* Container for buttons and error message */}
          <div className="flex justify-between items-center">
            {/* Left side: Demo Button and Error Message */}
            <div className="flex items-center space-x-2">
              {/* Demo Button */}
              {demoGlobalSettings && ( // Only show if demo data is available
                <button
                  onClick={handleLoadDemoData}
                  className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:opacity-50 flex-shrink-0"
                  title="Demó adatok betöltése a szerkesztőbe (felülírja a nem mentett változtatásokat)"
                  disabled={isSaving}
                >
                  <HelpCircle className="w-4 h-4 mr-1" aria-hidden="true" />{" "}
                  Demó adatok
                </button>
              )}
              {/* Error Message Area */}
              <div
                className="text-red-600 text-sm h-6 flex items-center min-w-[200px]"
                role="alert"
                aria-live="assertive"
              >
                {openedDuringLoading && (
                  <>
                    <AlertTriangle
                      className="w-4 h-4 mr-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      ⚠️ Adatvesztés elkerülése érdekében a mentés letiltva.
                      Zárja be ezt az ablakot és nyissa meg újra.
                    </span>
                  </>
                )}
                {!openedDuringLoading && saveError && (
                  <>
                    <AlertTriangle
                      className="w-4 h-4 mr-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{saveError}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                disabled={isSaving}
              >
                Mégsem
              </button>
              <button
                onClick={saveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 flex items-center min-w-[180px] justify-center" // Added min-width and justify
                disabled={isSaving || !globalSettings || openedDuringLoading} // Disable if no settings loaded or opened during loading
                aria-label={
                  isSaving ? "Mentés folyamatban" : "Változtatások mentése"
                }
              >
                {isSaving && (
                  <Loader
                    className="w-4 h-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {isSaving ? "Mentés..." : "Változtatások mentése"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Edit/Add Sub-Modal */}
      {showStaffEditModal && (
        <StaffEditSubModal
          staffMember={editingStaffMember}
          // Pass LOCAL category state to the sub-modal for its dropdowns
          globalSettings={{ units, groups, jobTitles }}
          onSave={handleSaveStaffSubModal}
          onClose={() => setShowStaffEditModal(false)}
        />
      )}
    </div>
  );
};

export default SettingsModal;

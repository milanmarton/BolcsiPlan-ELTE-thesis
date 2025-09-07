import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { firestore } from "../firebaseConfig";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { getWeekDates } from "../utils/helpers";

// ==========================================================================
// Constants & Default Structures
// ==========================================================================

/**
 * @constant {object} demoGlobalSettings
 * Pre-defined sample global settings data for demonstration purposes.
 * Includes units, groups, job titles, shift types, time slots, and a sample staff list.
 */
const demoGlobalSettings = {
  units: [
    "I.",
    "II.",
    "III.",
    "IV.",
    "V.",
    "Konyha",
    "Techn. dolg.",
    "Titkárság",
  ],
  groups: [
    "Süni (A)",
    "Maci (B)",
    "Csibe (A)",
    "Méhecske (B)",
    "Pillangó (A)",
    "Őzike (B)",
    "Mókus (A)",
    "Katica (B)",
    "Csiga (A)",
    "Nyuszi (B)",
    "fregoli m.rend",
  ],
  jobTitles: [
    "k.gy.n.",
    "dajka",
    "élelm.vez.",
    "szakács",
    "mosónő",
    "karbantartó",
    "adminiszt.",
    "int.vez.hely.",
    "int.vez.",
  ],
  shiftTypes: [
    { code: "DE", name: "Délelőtt", color: "#cce6ff" },
    { code: "DU", name: "Délután", color: "#ffcc99" },
    { code: "K", name: "Köztes", color: "#ccffcc" },
    { code: "H", name: "Helyettesítés", color: "#e6ccff" },
    { code: "FSZ", name: "Fizetett szabadság", color: "#99ff99" },
    { code: "TP", name: "Táppénz", color: "#ff9999" },
    { code: "TK", name: "Továbbképzés", color: "#ffff99" },
    { code: "K1", name: "Konyha 1", color: "#d2b48c" },
    { code: "K2", name: "Konyha 2", color: "#d2b48c" },
  ],
  timeSlots: {
    DE: "6:30-13:50",
    DU: "9:40-17:00",
    K: "8:00-15:20",
    H: "7:40-16:00",
    K1: "6:30-14:50",
    K2: "7:40-16:00",
  },
  staffList: [
    {
      id: "staff_demo_1",
      name: "Nagy Mária",
      employeeNumber: "1",
      defaultUnit: "I.",
      defaultGroup: "Süni (A)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 0,
    },
    {
      id: "staff_demo_2",
      name: "Kiss Józsefné",
      employeeNumber: "2",
      defaultUnit: "I.",
      defaultGroup: "Süni (A)",
      defaultJobTitle: "dajka",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "staff_demo_3",
      name: "Kovács István",
      employeeNumber: "K1",
      defaultUnit: "Konyha",
      defaultGroup: "",
      defaultJobTitle: "szakács",
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "staff_demo_4",
      name: "Tóth Éva",
      employeeNumber: "4",
      defaultUnit: "II.",
      defaultGroup: "Csibe (A)",
      defaultJobTitle: "k.gy.n.",
      isActive: false,
      sortOrder: 3,
    },
    {
      id: "staff_demo_5",
      name: "Varga Katalin",
      employeeNumber: "5",
      defaultUnit: "II.",
      defaultGroup: "Csibe (A)",
      defaultJobTitle: "dajka",
      isActive: true,
      sortOrder: 4,
    },
    {
      id: "staff_demo_6",
      name: "Molnár Péter",
      employeeNumber: "6",
      defaultUnit: "II.",
      defaultGroup: "Méhecske (B)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 5,
    },
    {
      id: "staff_demo_7",
      name: "Horváth Anna",
      employeeNumber: "7",
      defaultUnit: "II.",
      defaultGroup: "Méhecske (B)",
      defaultJobTitle: "dajka",
      isActive: true,
      sortOrder: 6,
    },
    {
      id: "staff_demo_8",
      name: "Szabó Zsuzsanna",
      employeeNumber: "8",
      defaultUnit: "III.",
      defaultGroup: "Pillangó (A)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 7,
    },
    {
      id: "staff_demo_9",
      name: "Fehér Gábor",
      employeeNumber: "9",
      defaultUnit: "III.",
      defaultGroup: "Pillangó (A)",
      defaultJobTitle: "dajka",
      isActive: true,
      sortOrder: 8,
    },
    {
      id: "staff_demo_10",
      name: "Pintér Erzsébet",
      employeeNumber: "10",
      defaultUnit: "III.",
      defaultGroup: "Őzike (B)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 9,
    },
    {
      id: "staff_demo_11",
      name: "Balogh Judit",
      employeeNumber: "11",
      defaultUnit: "IV.",
      defaultGroup: "Mókus (A)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 10,
    },
    {
      id: "staff_demo_12",
      name: "Fekete László",
      employeeNumber: "E1",
      defaultUnit: "Konyha",
      defaultGroup: "",
      defaultJobTitle: "élelm.vez.",
      isActive: true,
      sortOrder: 11,
    },
    {
      id: "staff_demo_13",
      name: "Takács Imre",
      employeeNumber: "T1",
      defaultUnit: "Techn. dolg.",
      defaultGroup: "",
      defaultJobTitle: "karbantartó",
      isActive: true,
      sortOrder: 12,
    },
    {
      id: "staff_demo_14",
      name: "Pap Mónika",
      employeeNumber: "14",
      defaultUnit: "Techn. dolg.",
      defaultGroup: "",
      defaultJobTitle: "mosónő",
      isActive: true,
      sortOrder: 13,
    },
    {
      id: "staff_demo_15",
      name: "Simon Andrea",
      employeeNumber: "A1",
      defaultUnit: "Titkárság",
      defaultGroup: "",
      defaultJobTitle: "adminiszt.",
      isActive: true,
      sortOrder: 14,
    },
    {
      id: "staff_demo_16",
      name: "Igazgató János",
      employeeNumber: "IV1",
      defaultUnit: "Titkárság",
      defaultGroup: "",
      defaultJobTitle: "int.vez.",
      isActive: true,
      sortOrder: 15,
    },
  ],
};

/**
 * @constant {object} blankGlobalSettings
 * Default empty structure for global settings, used when initializing settings for a new user.
 */
const blankGlobalSettings = {
  units: [],
  groups: [],
  jobTitles: [],
  shiftTypes: [],
  timeSlots: {},
  staffList: [],
};

/**
 * @function defaultWeeklySchedule
 * Creates a default structure for an empty weekly schedule Firestore document.
 * @param {Date} startDate - The start date (Monday) of the week.
 * @returns {object} An object representing an empty schedule for the week.
 * @property {string} weekStartDate - The start date of the week in 'YYYY-MM-DD' format.
 * @property {Array} staff - An empty array, intended to hold staff-specific weekly data.
 */
const defaultWeeklySchedule = (startDate) => ({
  weekStartDate: startDate.toISOString().split("T")[0],
  staff: [],
});

// ==========================================================================
// Custom Hook: useStaffData
// ==========================================================================

/**
 * @typedef {object} UseStaffDataReturn An object containing state and functions for staff data management.
 * @property {object | null} globalSettings The loaded global settings object, or null if loading or error.
 * @property {object | null} currentWeeklySchedule The loaded schedule data for the `currentWeek`, or null if loading or error.
 * @property {boolean} settingsLoading True if global settings are currently being loaded.
 * @property {boolean} scheduleLoading True if the weekly schedule is currently being loaded.
 * @property {string | null} saveError An error message if a save operation failed, null otherwise.
 * @property {object} demoGlobalSettings The pre-defined demo settings data.
 * @property {function(object): Promise<boolean>} saveGlobalSettings Saves the entire global settings object to Firestore.
 * @property {function(string, object): Promise<boolean>} saveWeeklySchedule Saves a specific weekly schedule object to Firestore.
 * @property {function(string): Promise<boolean>} handleAddUnit Adds a new unit to global settings.
 * @property {function(string): Promise<boolean>} handleRemoveUnit Removes a unit from global settings.
 * @property {function(string): Promise<boolean>} handleAddGroup Adds a new group to global settings.
 * @property {function(string): Promise<boolean>} handleRemoveGroup Removes a group from global settings.
 * @property {function(string): Promise<boolean>} handleAddJobTitle Adds a new job title to global settings.
 * @property {function(string): Promise<boolean>} handleRemoveJobTitle Removes a job title from global settings.
 * @property {function(Array<object>, object): Promise<boolean>} handleUpdateShiftTypes Updates shift types and time slots in global settings.
 * @property {function(object): Promise<boolean>} addStaffToList Adds a new staff member to the global staff list.
 * @property {function(object): Promise<boolean>} updateStaffInList Updates an existing staff member's core data in the global list.
 * @property {function(string): Promise<boolean>} deleteStaffFromList Deletes a staff member from the global list.
 * @property {function(Array<object>): Promise<boolean>} updateStaffListOrder Updates the sort order of the global staff list.
 * @property {function(object): void} updateStaffInWeeklySchedule Adds or updates a staff member's data within the current weekly schedule.
 * @property {function(string): void} removeStaffFromWeeklySchedule Removes a staff member's data from the current weekly schedule.
 * @property {function(string): string} getShiftColor Returns the color code for a given shift code.
 * @property {function(): object} getStaffByUnit Returns staff data grouped and sorted by unit.
 * @property {function(Date, Date): Promise<boolean>} copyScheduleFromWeek Copies the schedule from a source week to a target week.
 */

/**
 * Custom hook to manage all staff-related data, including global settings
 * (units, groups, job titles, shift types, staff list) and weekly schedule data.
 * Handles fetching from and saving to Firestore, managing loading states, and providing
 * functions to modify both global settings and weekly schedules.
 *
 * @param {Date} currentWeek - A Date object representing the Monday of the week currently being viewed/edited.
 * @returns {UseStaffDataReturn} The object containing state variables and functions.
 */
const useStaffData = (currentWeek) => {
  const { currentUser } = useAuth();

  // --- State ---
  const [globalSettings, setGlobalSettings] = useState(null);
  const [currentWeeklySchedule, setCurrentWeeklySchedule] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);

  // --- Memoized Values ---
  const currentWeekStartDate = useMemo(
    () => currentWeek.toISOString().split("T")[0],
    [currentWeek],
  );

  // ==========================================================================
  // Firestore Document References
  // ==========================================================================

  /**
   * @function getGlobalSettingsRef
   * Returns a Firestore document reference for the user's global settings.
   * @returns {import("firebase/firestore").DocumentReference | null} The document reference or null if no user is logged in.
   */
  const getGlobalSettingsRef = useCallback(() => {
    if (!currentUser) return null;
    return doc(firestore, `userSchedules/${currentUser.uid}/settings/global`);
  }, [currentUser]);

  /**
   * @function getWeeklyScheduleRef
   * Returns a Firestore document reference for a specific weekly schedule.
   * @param {string | Date} weekStartDateStr - The start date of the week (Monday) as a 'YYYY-MM-DD' string or a Date object.
   * @returns {import("firebase/firestore").DocumentReference | null} The document reference or null if no user is logged in.
   */
  const getWeeklyScheduleRef = useCallback(
    (weekStartDateStr) => {
      if (!currentUser) return null;
      // Ensure the date string is correctly formatted
      const formattedDate =
        weekStartDateStr instanceof Date
          ? weekStartDateStr.toISOString().split("T")[0]
          : weekStartDateStr.match(/^\d{4}-\d{2}-\d{2}$/)
            ? weekStartDateStr
            : new Date(weekStartDateStr).toISOString().split("T")[0]; // Fallback formatting
      return doc(
        firestore,
        `userSchedules/${currentUser.uid}/weeklySchedules/${formattedDate}`,
      );
    },
    [currentUser],
  );

  // ==========================================================================
  // Core Firestore Save Operations
  // ==========================================================================

  /**
   * @function saveGlobalSettings
   * Saves the entire global settings object to Firestore. Ensures staffList is sorted.
   * @param {object} newSettings - The complete global settings object to save.
   * @param {boolean} [bypassSafetyChecks=false] - If true, skips safety checks for accidental data deletion (use for demo data loading).
   * @returns {Promise<boolean>} True if the save was successful, false otherwise.
   */
  const saveGlobalSettings = useCallback(
    async (newSettings, bypassSafetyChecks = false) => {
      const docRef = getGlobalSettingsRef();
      if (!docRef || !newSettings) {
        console.error("Save failed: Missing docRef or newSettings");
        setSaveError("Mentési hiba: Hiányzó adatok vagy referencia.");
        return false;
      }
      setSaveError(null);

      // Safety check: Detect potentially accidental deletion of all data (unless bypassed for demo data)
      if (!bypassSafetyChecks) {
        const isEmpty = (arr) => !arr || arr.length === 0;
        const isEmptyObj = (obj) => !obj || Object.keys(obj).length === 0;

        const newUnits = newSettings.units || [];
        const newGroups = newSettings.groups || [];
        const newJobTitles = newSettings.jobTitles || [];
        const newStaffList = newSettings.staffList || [];
        const newShiftTypes = newSettings.shiftTypes || [];
        const newTimeSlots = newSettings.timeSlots || {};

        // Check if all major data structures are empty
        const allCategoriesEmpty =
          isEmpty(newUnits) && isEmpty(newGroups) && isEmpty(newJobTitles);
        const allDataEmpty =
          allCategoriesEmpty &&
          isEmpty(newStaffList) &&
          isEmpty(newShiftTypes) &&
          isEmptyObj(newTimeSlots);

        // If current settings exist and have data, but new settings are suspiciously empty
        if (globalSettings && !allDataEmpty) {
          const currentUnits = globalSettings.units || [];
          const currentGroups = globalSettings.groups || [];
          const currentJobTitles = globalSettings.jobTitles || [];
          const currentStaffList = globalSettings.staffList || [];
          const currentShiftTypes = globalSettings.shiftTypes || [];

          const hadData =
            currentUnits.length > 0 ||
            currentGroups.length > 0 ||
            currentJobTitles.length > 0 ||
            currentStaffList.length > 0 ||
            currentShiftTypes.length > 0;

          // Warn if we're about to delete all categories but keep other data
          if (
            hadData &&
            allCategoriesEmpty &&
            (!isEmpty(newStaffList) || !isEmpty(newShiftTypes))
          ) {
            console.error(
              "Save blocked: Attempting to delete all categories (units, groups, job titles) while keeping staff/shifts.",
            );
            setSaveError(
              "Biztonsági figyelmeztetés: Minden kategória (egységek, csoportok, munkakörök) törlésre kerülne, de a személyzet és műszakok megmaradnának. Ez valószínűleg nem szándékos. Ellenőrizze az adatokat.",
            );
            return false;
          }

          // Warn if we're about to delete everything
          if (hadData && allDataEmpty) {
            console.error(
              "Save blocked: Attempting to delete all settings data.",
            );
            setSaveError(
              "Biztonsági figyelmeztetés: Az összes beállítás törlésre kerülne (egységek, csoportok, munkakörök, személyzet, műszaktípusok). Ez valószínűleg nem szándékos. Ha valóban törölni szeretné az összes adatot, használja a 'Demó adatok' funkciót a beállítások újbóli feltöltéséhez.",
            );
            return false;
          }
        }
      } // End of bypassSafetyChecks conditional

      try {
        // Ensure staffList exists and is sorted before saving
        const settingsToSave = {
          ...newSettings,
          staffList: (newSettings.staffList || [])
            .sort(
              (a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity),
            )
            .map((staff) => ({ ...staff })), // Create shallow copies
        };
        await setDoc(docRef, settingsToSave, { merge: true }); // Use merge: true to avoid overwriting unrelated fields if structure changes
        console.log("Global settings saved successfully.");
        return true;
      } catch (error) {
        console.error("Error saving global settings:", error);
        setSaveError(
          `Globális beállítások mentése sikertelen: ${error.message}`,
        );
        return false;
      }
    },
    [getGlobalSettingsRef, globalSettings],
  );

  /**
   * @function saveWeeklySchedule
   * Saves a specific weekly schedule object to Firestore. Cleans the data before saving.
   * @param {string} weekStartDateStr - The start date of the week ('YYYY-MM-DD').
   * @param {object} newScheduleData - The weekly schedule data object to save.
   * @returns {Promise<boolean>} True if the save was successful, false otherwise.
   */
  const saveWeeklySchedule = useCallback(
    async (weekStartDateStr, newScheduleData) => {
      const docRef = getWeeklyScheduleRef(weekStartDateStr);
      if (!docRef || !newScheduleData) return false;
      // Prepare data for saving, ensuring only necessary fields are included
      const scheduleToSave = {
        weekStartDate: newScheduleData.weekStartDate,
        staff: (newScheduleData.staff || []).map((s) => ({
          staffId: s.staffId,
          name: s.name || "", // Default to empty string if missing
          unit: s.unit || "",
          group: s.group || "",
          jobTitle: s.jobTitle || "",
          shifts: s.shifts || {},
        })),
      };
      setSaveError(null);
      try {
        await setDoc(docRef, scheduleToSave);
        console.log(
          `Weekly schedule for ${weekStartDateStr} saved successfully.`,
        );
        return true;
      } catch (error) {
        console.error(
          `Error saving weekly schedule for ${weekStartDateStr}:`,
          error,
        );
        setSaveError(`Heti beosztás mentése sikertelen: ${error.message}`);
        return false;
      }
    },
    [getWeeklyScheduleRef],
  );

  // ==========================================================================
  // Data Loading Effects
  // ==========================================================================

  /**
   * @effect Loads global settings from Firestore on mount and when the user changes.
   * Sets up a real-time listener (onSnapshot) to keep settings updated.
   * Initializes with blank settings if none exist for the user.
   */
  useEffect(() => {
    console.log("Effect: Attempting to load Global Settings");
    setSettingsLoading(true);
    setGlobalSettings(null); // Reset on user change
    setCurrentWeeklySchedule(null); // Reset schedule when settings reload
    setSaveError(null);
    const docRef = getGlobalSettingsRef();

    if (!docRef) {
      console.log("Effect: No user logged in, skipping global settings load.");
      setSettingsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure staffList exists, has defaults, and is sorted
          data.staffList = (data.staffList || [])
            .map((staff) => ({
              isActive: true, // Default new staff to active
              sortOrder: Infinity, // Default sortOrder
              ...staff,
            }))
            .sort(
              (a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity),
            );
          setGlobalSettings(data);
          console.log("Global settings loaded/updated from Firestore.");
        } else {
          console.log(
            "No global settings found in Firestore, initializing with BLANK state.",
          );
          setGlobalSettings(blankGlobalSettings);
          // Automatically save the blank settings for a new user or if document was deleted
          saveGlobalSettings(blankGlobalSettings, true); // Bypass safety checks for legitimate initialization
        }
        setSettingsLoading(false);
      },
      (error) => {
        console.error("Error listening to global settings:", error);
        setSaveError(`Hiba a beállítások betöltésekor: ${error.message}`);
        setGlobalSettings(null);
        setSettingsLoading(false);
      },
    );

    // Cleanup listener on unmount or user change
    return () => {
      console.log("Effect Cleanup: Unsubscribing from Global Settings");
      unsubscribe();
    };
  }, [currentUser, getGlobalSettingsRef, saveGlobalSettings]); // Dependencies ensure rerun on user change

  /**
   * @effect Loads the weekly schedule from Firestore for the `currentWeek`.
   * Sets up a real-time listener (onSnapshot). Creates a default empty schedule if none exists.
   * Depends on `currentUser`, `currentWeekStartDate`, `settingsLoading`, and `currentWeek`.
   */
  useEffect(() => {
    if (!currentUser || settingsLoading) {
      console.log(
        "Effect: Skipping weekly schedule load (no user or settings still loading).",
      );
      // If settings are loading, schedule is also implicitly loading
      setScheduleLoading(settingsLoading);
      // If no user, set schedule loading to false explicitly
      if (!currentUser) setScheduleLoading(false);
      setCurrentWeeklySchedule(null); // Ensure schedule is cleared if prerequisites aren't met
      return;
    }

    console.log(
      `Effect: Attempting to load Weekly Schedule for ${currentWeekStartDate}`,
    );
    setScheduleLoading(true);
    setCurrentWeeklySchedule(null); // Reset while loading new week
    setSaveError(null);

    const docRef = getWeeklyScheduleRef(currentWeekStartDate);
    if (!docRef) {
      // Should not happen if currentUser is checked, but as a safeguard
      setScheduleLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const weeklyData = docSnap.data();
          setCurrentWeeklySchedule(weeklyData);
          console.log(
            `Weekly schedule loaded/updated for ${currentWeekStartDate}.`,
          );
        } else {
          console.log(
            `No schedule document found for ${currentWeekStartDate}, using default empty state.`,
          );
          // Use default structure, but don't save it automatically here. Saving happens on modification.
          setCurrentWeeklySchedule(defaultWeeklySchedule(currentWeek));
        }
        setScheduleLoading(false);
      },
      (error) => {
        console.error(
          `Error listening to weekly schedule ${currentWeekStartDate}:`,
          error,
        );
        setSaveError(
          `Hiba a ${currentWeekStartDate} heti beosztás betöltésekor: ${error.message}`,
        );
        setCurrentWeeklySchedule(null);
        setScheduleLoading(false);
      },
    );

    // Cleanup listener on unmount or when dependencies change
    return () => {
      console.log(
        `Effect Cleanup: Unsubscribing from Weekly Schedule ${currentWeekStartDate}`,
      );
      unsubscribe();
    };
  }, [
    currentUser,
    currentWeekStartDate,
    getWeeklyScheduleRef,
    settingsLoading,
    currentWeek,
  ]); // Added currentWeek dependency for defaultWeeklySchedule

  // ==========================================================================
  // Global Settings Management - Categories & Shifts
  // ==========================================================================

  /**
   * @function addCategoryItem
   * Adds a new item (unit, group, or job title) to the global settings if it doesn't exist.
   * @param {string} item - The new category item to add.
   * @param {'units' | 'groups' | 'jobTitles'} categoryKey - The key in globalSettings to add the item to.
   * @returns {Promise<boolean>} True if the item was added and saved successfully, false otherwise.
   */
  const addCategoryItem = async (item, categoryKey) => {
    const trimmedItem = item.trim();
    if (!globalSettings || !trimmedItem) return false;

    // Check if item already exists (case-insensitive)
    if (
      globalSettings[categoryKey]?.some(
        (existing) => existing.toLowerCase() === trimmedItem.toLowerCase(),
      )
    ) {
      console.warn(
        `Category item "${trimmedItem}" already exists in ${categoryKey}.`,
      );
      setSaveError(
        `"${trimmedItem}" már létezik a(z) ${categoryKey} listában.`,
      );
      return false;
    }

    const newSettings = {
      ...globalSettings,
      [categoryKey]: [...(globalSettings[categoryKey] || []), trimmedItem],
    };
    const success = await saveGlobalSettings(newSettings);
    return success;
  };

  /**
   * @function removeCategoryItem
   * Removes a category item from the global settings list.
   * Note: This function ONLY removes the item from the list. It does NOT update staff defaults automatically.
   * Use `saveGlobalSettings` after preparing the full desired state (including updated staff defaults) for removals.
   * @param {string} item - The category item to remove.
   * @param {'units' | 'groups' | 'jobTitles'} categoryKey - The key in globalSettings to remove the item from.
   * @returns {Promise<boolean>} True if the item was removed and saved successfully, false otherwise.
   */
  const removeCategoryItem = async (item, categoryKey) => {
    if (!globalSettings) {
      console.error("removeCategoryItem called before globalSettings loaded.");
      setSaveError("Hiba: Beállítások nincsenek betöltve a törléshez.");
      return false;
    }
    if (!item) {
      console.warn("removeCategoryItem called with no item to remove.");
      return false;
    }

    const currentItems = globalSettings[categoryKey] || [];
    if (!currentItems.includes(item)) {
      console.warn(
        `Item "${item}" not found in category "${categoryKey}" for removal.`,
      );
      return false; // Item doesn't exist, consider it success or no-op
    }

    const newSettings = {
      ...globalSettings,
      [categoryKey]: currentItems.filter((i) => i !== item),
      // IMPORTANT: Staff defaults are NOT updated here. Parent component
      // using this hook should ideally call saveGlobalSettings with the
      // fully updated state (including cleared staff defaults if necessary).
    };
    const success = await saveGlobalSettings(newSettings);
    if (!success) {
      console.error(`Failed to save removal of ${item} from ${categoryKey}.`);
    }
    return success;
  };

  // --- Specific Category Handlers ---
  const handleAddUnit = (unit) => addCategoryItem(unit, "units");
  const handleAddGroup = (group) => addCategoryItem(group, "groups");
  const handleAddJobTitle = (jobTitle) =>
    addCategoryItem(jobTitle, "jobTitles");
  const handleRemoveUnit = (unit) => removeCategoryItem(unit, "units");
  const handleRemoveGroup = (group) => removeCategoryItem(group, "groups");
  const handleRemoveJobTitle = (jobTitle) =>
    removeCategoryItem(jobTitle, "jobTitles");

  /**
   * @function handleUpdateShiftTypes
   * Updates the shift types and time slots in the global settings.
   * @param {Array<object>} newShiftTypes - The new array of shift type objects.
   * @param {object} newTimeSlots - The new object mapping shift codes to time slots.
   * @returns {Promise<boolean>} True if the update was saved successfully, false otherwise.
   */
  const handleUpdateShiftTypes = async (newShiftTypes, newTimeSlots) => {
    if (!globalSettings) return false;
    const newSettings = {
      ...globalSettings,
      shiftTypes: newShiftTypes || [],
      timeSlots: newTimeSlots || {},
    };
    const success = await saveGlobalSettings(newSettings);
    return success;
  };

  // ==========================================================================
  // Global Settings Management - Staff List
  // ==========================================================================

  /**
   * @function addStaffToList
   * Adds a new staff member to the global staff list. Assumes core data includes an 'id'.
   * @param {object} staffMemberCoreData - The core data of the new staff member.
   * @returns {Promise<boolean>} True if added and saved successfully, false otherwise.
   */
  const addStaffToList = async (staffMemberCoreData) => {
    if (!globalSettings || !staffMemberCoreData || !staffMemberCoreData.id) {
      setSaveError("Érvénytelen dolgozói adat a hozzáadáshoz.");
      return false;
    }
    // Check for duplicate ID
    if (
      globalSettings.staffList?.some((s) => s.id === staffMemberCoreData.id)
    ) {
      setSaveError(
        `Hiba: ${staffMemberCoreData.id} azonosítójú dolgozó már létezik.`,
      );
      return false;
    }
    // Add the new member and re-sort
    const newStaffList = [
      ...(globalSettings.staffList || []),
      {
        ...staffMemberCoreData,
        sortOrder:
          staffMemberCoreData.sortOrder ??
          (globalSettings.staffList?.length || 0),
      }, // Assign sort order if missing
    ].sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

    const newSettings = { ...globalSettings, staffList: newStaffList };
    return await saveGlobalSettings(newSettings);
  };

  /**
   * @function updateStaffInList
   * Updates an existing staff member's core data in the global list.
   * @param {object} staffMemberCoreData - The updated core data of the staff member (must include 'id').
   * @returns {Promise<boolean>} True if updated and saved successfully, false otherwise.
   */
  const updateStaffInList = async (staffMemberCoreData) => {
    if (!globalSettings || !staffMemberCoreData || !staffMemberCoreData.id) {
      setSaveError("Érvénytelen dolgozói adat a frissítéshez.");
      return false;
    }
    // Update the member and re-sort
    const newStaffList = (globalSettings.staffList || [])
      .map((staff) =>
        staff.id === staffMemberCoreData.id
          ? { ...staff, ...staffMemberCoreData } // Merge existing and new data
          : staff,
      )
      .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

    const newSettings = { ...globalSettings, staffList: newStaffList };
    return await saveGlobalSettings(newSettings);
  };

  /**
   * @function deleteStaffFromList
   * Deletes a staff member from the global list and recalculates sortOrder.
   * Also attempts to remove the staff member from the currently loaded weekly schedule if present.
   * @param {string} staffId - The ID of the staff member to delete.
   * @returns {Promise<boolean>} True if deleted from global list and saved successfully, false otherwise.
   */
  const deleteStaffFromList = async (staffId) => {
    if (!globalSettings || !staffId) {
      setSaveError("Érvénytelen dolgozói ID a törléshez.");
      return false;
    }
    // Filter out the member and re-assign sortOrder based on new index
    const newStaffList = (globalSettings.staffList || [])
      .filter((staff) => staff.id !== staffId)
      .map((staff, index) => ({ ...staff, sortOrder: index })); // Re-index

    const newSettings = { ...globalSettings, staffList: newStaffList };
    const success = await saveGlobalSettings(newSettings);

    // If global delete succeeds, also remove from current weekly schedule state (if loaded and present)
    if (
      success &&
      currentWeeklySchedule?.staff.some((s) => s.staffId === staffId)
    ) {
      // Note: This calls the async saveWeeklySchedule internally
      removeStaffFromWeeklySchedule(staffId);
    }
    return success;
  };

  /**
   * @function updateStaffListOrder
   * Updates the sort order for all staff members based on a provided ordered list.
   * @param {Array<object>} orderedStaffList - The staff list array in the desired order.
   * @returns {Promise<boolean>} True if the order was updated and saved successfully, false otherwise.
   */
  const updateStaffListOrder = async (orderedStaffList) => {
    if (!globalSettings || !Array.isArray(orderedStaffList)) return false;
    // Assign sortOrder based on the new array index
    const newSettings = {
      ...globalSettings,
      staffList: orderedStaffList.map((staff, index) => ({
        ...staff,
        sortOrder: index,
      })),
    };
    return await saveGlobalSettings(newSettings);
  };

  // ==========================================================================
  // Weekly Schedule Management - Staff Specific Data
  // ==========================================================================

  /**
   * @function updateStaffInWeeklySchedule
   * Adds or updates a staff member's data (name, unit, group, jobTitle, shifts)
   * specifically for the currently loaded week. Performs an optimistic update of local state
   * and then saves asynchronously to Firestore.
   * @param {object} staffMemberWeeklyData - The weekly data for the staff member (must include 'staffId').
   */
  const updateStaffInWeeklySchedule = (staffMemberWeeklyData) => {
    if (!staffMemberWeeklyData?.staffId) {
      setSaveError("Hiba: Érvénytelen heti dolgozói adat a frissítéshez.");
      return;
    }

    // Use the current state or the default structure if state is null/initial
    const baseSchedule =
      currentWeeklySchedule || defaultWeeklySchedule(currentWeek);

    const existingIndex = baseSchedule.staff.findIndex(
      (s) => s.staffId === staffMemberWeeklyData.staffId,
    );

    // Prepare the data subset to store for the week
    const dataToStore = {
      staffId: staffMemberWeeklyData.staffId,
      name: staffMemberWeeklyData.name || "", // Ensure fields exist
      unit: staffMemberWeeklyData.unit || "",
      group: staffMemberWeeklyData.group || "",
      jobTitle: staffMemberWeeklyData.jobTitle || "",
      shifts: staffMemberWeeklyData.shifts || {},
    };

    let newStaffArray;
    if (existingIndex >= 0) {
      // Update existing entry
      newStaffArray = baseSchedule.staff.map((staff, index) =>
        index === existingIndex ? dataToStore : staff,
      );
    } else {
      // Add new entry
      newStaffArray = [...baseSchedule.staff, dataToStore];
    }

    const newSchedule = { ...baseSchedule, staff: newStaffArray };

    // Optimistic UI update
    setCurrentWeeklySchedule(newSchedule);
    // Asynchronous save to Firestore
    saveWeeklySchedule(currentWeekStartDate, newSchedule);
  };

  /**
   * @function removeStaffFromWeeklySchedule
   * Removes a staff member's data entirely from the currently loaded weekly schedule.
   * Performs an optimistic update of local state and then saves asynchronously to Firestore.
   * @param {string} staffId - The ID of the staff member to remove from the week.
   */
  const removeStaffFromWeeklySchedule = (staffId) => {
    // Don't proceed if the schedule isn't loaded or the staff isn't in this week
    if (
      !currentWeeklySchedule ||
      !currentWeeklySchedule.staff.some((s) => s.staffId === staffId)
    ) {
      return;
    }

    const newSchedule = {
      ...currentWeeklySchedule,
      staff: currentWeeklySchedule.staff.filter((s) => s.staffId !== staffId),
    };

    // Optimistic UI update
    setCurrentWeeklySchedule(newSchedule);
    // Asynchronous save to Firestore
    saveWeeklySchedule(currentWeekStartDate, newSchedule);
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * @function getShiftColor
   * Retrieves the background color associated with a shift code from global settings.
   * @param {string} shiftCode - The shift code (e.g., 'DE').
   * @returns {string} The hex color code (e.g., '#ffffff') or a default white color.
   */
  const getShiftColor = useCallback(
    (shiftCode) => {
      if (!globalSettings?.shiftTypes) return "#ffffff"; // Default white if settings not loaded
      const shiftType = globalSettings.shiftTypes.find(
        (type) => type.code === shiftCode,
      );
      // Return the color if found and valid, otherwise default white
      return shiftType?.color && typeof shiftType.color === "string"
        ? shiftType.color
        : "#ffffff";
    },
    [globalSettings?.shiftTypes], // Depend only on shiftTypes array
  );

  /**
   * @function getStaffByUnit
   * Combines global staff list data with weekly schedule overrides.
   * Filters by active staff, groups the results by unit, and sorts units and staff
   * according to the order defined in global settings. Marks 'orphaned' data
   * (unit/group/jobTitle used in the weekly schedule but no longer existing in global settings).
   * @returns {object} An object where keys are unit names (or "" for unassigned) and values are
   *                   arrays of staff objects sorted for display in the schedule table. Returns empty object if loading or no active staff.
   */
  const getStaffByUnit = useCallback(() => {
    if (settingsLoading || scheduleLoading || !globalSettings) {
      return {};
    }

    const activeGlobalStaff = (globalSettings.staffList || []).filter(
      (s) => s.isActive,
    );
    if (activeGlobalStaff.length === 0) {
      return {}; // Return empty if no active staff defined globally
    }

    // Create a map for quick lookup of weekly data by staffId
    const weeklyStaffDataMap = (currentWeeklySchedule?.staff || []).reduce(
      (map, weeklyStaff) => {
        map[weeklyStaff.staffId] = weeklyStaff;
        return map;
      },
      {},
    );

    // Create Sets for efficient validity checks of categories
    const validUnits = new Set(globalSettings.units || []);
    const validGroups = new Set(globalSettings.groups || []);
    const validJobTitles = new Set(globalSettings.jobTitles || []);

    // Combine global and weekly data for each active staff member
    const combinedStaffList = activeGlobalStaff.map((globalStaff) => {
      const weeklyData = weeklyStaffDataMap[globalStaff.id];

      // Determine effective category, preferring weekly override, falling back to global default
      const weeklyUnit = weeklyData?.unit;
      const globalUnit = globalStaff.defaultUnit ?? "";
      const effectiveUnit = weeklyUnit ?? globalUnit;
      const isOrphanedUnit = !!weeklyUnit && !validUnits.has(weeklyUnit); // True if weeklyUnit exists but is not in global units

      const weeklyGroup = weeklyData?.group;
      const globalGroup = globalStaff.defaultGroup ?? "";
      const effectiveGroup = weeklyGroup ?? globalGroup;
      const isOrphanedGroup = !!weeklyGroup && !validGroups.has(weeklyGroup);

      const weeklyJobTitle = weeklyData?.jobTitle;
      const globalJobTitle = globalStaff.defaultJobTitle ?? "";
      const effectiveJobTitle = weeklyJobTitle ?? globalJobTitle;
      const isOrphanedJobTitle =
        !!weeklyJobTitle && !validJobTitles.has(weeklyJobTitle);

      return {
        staffId: globalStaff.id,
        name: weeklyData?.name ?? globalStaff.name, // Prefer weekly name override
        unit: effectiveUnit,
        displayUnit: isOrphanedUnit
          ? `${effectiveUnit} (törölt)`
          : effectiveUnit,
        isOrphanedUnit,
        group: effectiveGroup,
        displayGroup: isOrphanedGroup
          ? `${effectiveGroup} (törölt)`
          : effectiveGroup,
        isOrphanedGroup,
        jobTitle: effectiveJobTitle,
        displayJobTitle: isOrphanedJobTitle
          ? `${effectiveJobTitle} (törölt)`
          : effectiveJobTitle,
        isOrphanedJobTitle,
        shifts: weeklyData?.shifts ?? {}, // Use weekly shifts, or empty object if none for the week
        sortOrder: globalStaff.sortOrder ?? Infinity, // From global list
        employeeNumber: globalStaff.employeeNumber ?? "", // From global list
      };
    });

    // Group staff by their effective unit
    const groupedByUnit = combinedStaffList.reduce((acc, staff) => {
      const unitKey = staff.unit || ""; // Use empty string for "unassigned" unit
      if (!acc[unitKey]) acc[unitKey] = [];
      acc[unitKey].push(staff);
      return acc;
    }, {});

    // --- Sorting Logic ---
    // Create maps for category sort order lookup
    const createOrderMap = (items = []) =>
      items.reduce((map, item, index) => {
        map[item] = index;
        return map;
      }, {});
    const unitOrderMap = createOrderMap(globalSettings.units);
    const groupOrderMap = createOrderMap(globalSettings.groups);
    const jobTitleOrderMap = createOrderMap(globalSettings.jobTitles);

    // 1. Sort the unit keys based on global settings order
    const sortedUnitKeys = Object.keys(groupedByUnit).sort((a, b) => {
      // Check if units are valid according to current global settings
      const isUnitAValid = validUnits.has(a);
      const isUnitBValid = validUnits.has(b);

      // Get sort index, Infinity if orphaned/invalid or ""
      const indexA =
        a === ""
          ? Infinity
          : isUnitAValid
            ? (unitOrderMap[a] ?? Infinity)
            : Infinity;
      const indexB =
        b === ""
          ? Infinity
          : isUnitBValid
            ? (unitOrderMap[b] ?? Infinity)
            : Infinity;

      // Sort "" (unassigned) to the end
      if (a === "") return 1;
      if (b === "") return -1;

      // Sort orphaned units after valid units
      if (indexA === Infinity && indexB !== Infinity) return 1;
      if (indexA !== Infinity && indexB === Infinity) return -1;

      // If both are orphaned, sort alphabetically
      if (indexA === Infinity && indexB === Infinity) return a.localeCompare(b);

      // Otherwise, sort by defined order
      return indexA - indexB;
    });

    // 2. Sort staff within each unit
    const finalSortedResult = {};
    sortedUnitKeys.forEach((unitKey) => {
      groupedByUnit[unitKey].sort((a, b) => {
        // --- Primary Sort: Group ---
        const isGroupAOrphaned = a.isOrphanedGroup;
        const isGroupBOrphaned = b.isOrphanedGroup;
        const groupIndexA = !isGroupAOrphaned
          ? (groupOrderMap[a.group || ""] ?? Infinity)
          : Infinity;
        const groupIndexB = !isGroupBOrphaned
          ? (groupOrderMap[b.group || ""] ?? Infinity)
          : Infinity;

        // Sort orphaned groups after valid ones
        if (groupIndexA !== groupIndexB) {
          if (groupIndexA === Infinity && groupIndexB !== Infinity) return 1;
          if (groupIndexA !== Infinity && groupIndexB === Infinity) return -1;
          // If neither is orphaned, sort by defined order
          return groupIndexA - groupIndexB;
        } else if (isGroupAOrphaned && isGroupBOrphaned) {
          // If both are orphaned, sort alphabetically by group name
          const groupCompare = (a.group || "").localeCompare(b.group || "");
          if (groupCompare !== 0) return groupCompare;
        } // If both valid and same index, proceed to next sort key

        // --- Secondary Sort: Job Title ---
        const isJobAOrphaned = a.isOrphanedJobTitle;
        const isJobBOrphaned = b.isOrphanedJobTitle;
        const jobIndexA = !isJobAOrphaned
          ? (jobTitleOrderMap[a.jobTitle || ""] ?? Infinity)
          : Infinity;
        const jobIndexB = !isJobBOrphaned
          ? (jobTitleOrderMap[b.jobTitle || ""] ?? Infinity)
          : Infinity;

        // Sort orphaned job titles after valid ones
        if (jobIndexA !== jobIndexB) {
          if (jobIndexA === Infinity && jobIndexB !== Infinity) return 1;
          if (jobIndexA !== Infinity && jobIndexB === Infinity) return -1;
          // If neither is orphaned, sort by defined order
          return jobIndexA - jobIndexB;
        } else if (isJobAOrphaned && isJobBOrphaned) {
          // If both are orphaned, sort alphabetically by job title
          const jobCompare = (a.jobTitle || "").localeCompare(b.jobTitle || "");
          if (jobCompare !== 0) return jobCompare;
        } // If both valid and same index, proceed to next sort key

        // --- Tertiary Sort: Global Staff Sort Order ---
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

        // --- Fallback Sort: Name ---
        return (a.name || "").localeCompare(b.name || "");
      });
      // Assign the sorted staff list to the unit key in the result
      finalSortedResult[unitKey] = groupedByUnit[unitKey];
    });

    return finalSortedResult;
  }, [globalSettings, currentWeeklySchedule, settingsLoading, scheduleLoading]);

  /**
   * @function copyScheduleFromWeek
   * Copies the weekly staff assignments (shifts, weekly overrides) from a source week
   * to a target week. Only copies data for staff who are currently active in the global list.
   * @param {Date} sourceWeekDate - The start date (Monday) of the source week.
   * @param {Date} targetWeekDate - The start date (Monday) of the target week.
   * @returns {Promise<boolean>} True if the copy was successful, false otherwise.
   */
  const copyScheduleFromWeek = useCallback(
    async (sourceWeekDate, targetWeekDate) => {
      if (!currentUser || !globalSettings) {
        alert(
          "Nem lehet másolni: Hiba a felhasználó vagy a beállítások betöltésekor.",
        );
        return false;
      }
      setScheduleLoading(true); // Indicate loading during copy operation
      setSaveError(null);
      const sourceWeekStr = sourceWeekDate.toISOString().split("T")[0];
      const targetWeekStr = targetWeekDate.toISOString().split("T")[0];
      const targetWeekDates = getWeekDates(targetWeekDate); // Get dates for the target week
      const sourceDocRef = getWeeklyScheduleRef(sourceWeekStr);
      const targetDocRef = getWeeklyScheduleRef(targetWeekStr);

      try {
        const sourceDocSnap = await getDoc(sourceDocRef);
        if (!sourceDocSnap.exists()) {
          alert(
            `A(z) ${sourceWeekStr} hétre nincs mentett beosztás, nem lehet másolni.`,
          );
          setScheduleLoading(false);
          return false;
        }
        const sourceData = sourceDocSnap.data();

        // Map source staff data to the target week structure
        const newTargetStaff = (sourceData.staff || [])
          .map((sourceStaff) => {
            // Find the corresponding staff member in the global list
            const globalStaffInfo = globalSettings.staffList?.find(
              (s) => s.id === sourceStaff.staffId,
            );
            // Skip if staff not found in global list or is inactive
            if (!globalStaffInfo || !globalStaffInfo.isActive) return null;

            // Create the new shifts object for the target week
            const newShifts = {};
            targetWeekDates.forEach((targetDate, dayIndex) => {
              const targetDateStr = targetDate.toISOString().split("T")[0];
              // Find the corresponding day in the source week
              const sourceDayDate = new Date(sourceWeekDate);
              sourceDayDate.setDate(sourceDayDate.getDate() + dayIndex);
              const sourceDayDateStr = sourceDayDate
                .toISOString()
                .split("T")[0];
              // Copy the shift code from the source day to the target day
              newShifts[targetDateStr] =
                sourceStaff.shifts?.[sourceDayDateStr] || "";
            });

            // Return the structure for the target week's staff entry
            return {
              staffId: sourceStaff.staffId,
              // Use weekly override from source if exists, else use current global name
              name: sourceStaff.name ?? globalStaffInfo.name,
              // Use weekly override from source if exists, else use current global default
              unit: sourceStaff.unit ?? globalStaffInfo.defaultUnit,
              group: sourceStaff.group ?? globalStaffInfo.defaultGroup,
              jobTitle: sourceStaff.jobTitle ?? globalStaffInfo.defaultJobTitle,
              shifts: newShifts, // The newly mapped shifts
            };
          })
          .filter((staff) => staff !== null); // Remove null entries (inactive/missing staff)

        // Create the complete schedule object for the target week
        const newTargetSchedule = {
          weekStartDate: targetWeekStr,
          staff: newTargetStaff,
        };

        // Save the new schedule to the target week's document
        await setDoc(targetDocRef, newTargetSchedule);
        console.log(
          `Schedule successfully copied from ${sourceWeekStr} to ${targetWeekStr}`,
        );

        // If the copied schedule is for the currently viewed week, update the local state
        if (targetWeekStr === currentWeekStartDate) {
          setCurrentWeeklySchedule(newTargetSchedule);
        }

        setScheduleLoading(false);
        return true;
      } catch (error) {
        console.error(
          `Error copying schedule from ${sourceWeekStr} to ${targetWeekStr}:`,
          error,
        );
        setSaveError(`Másolás sikertelen: ${error.message}`);
        setScheduleLoading(false);
        return false;
      }
    },
    [currentUser, globalSettings, getWeeklyScheduleRef, currentWeekStartDate],
  );

  // ==========================================================================
  // Hook Return Value
  // ==========================================================================

  return {
    // State
    globalSettings,
    currentWeeklySchedule,
    settingsLoading,
    scheduleLoading,
    saveError,
    // Constants / Defaults
    demoGlobalSettings,
    // Core Save Operations
    saveGlobalSettings,
    saveWeeklySchedule,
    // Global Settings Modifiers (Categories, Shifts, Staff List)
    handleAddUnit,
    handleRemoveUnit,
    handleAddGroup,
    handleRemoveGroup,
    handleAddJobTitle,
    handleRemoveJobTitle,
    handleUpdateShiftTypes,
    addStaffToList,
    updateStaffInList,
    deleteStaffFromList,
    updateStaffListOrder,
    // Weekly Schedule Modifiers
    updateStaffInWeeklySchedule,
    removeStaffFromWeeklySchedule,
    // Utilities
    getShiftColor,
    getStaffByUnit,
    copyScheduleFromWeek,
  };
};

export default useStaffData;

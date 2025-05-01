import { describe, it, expect } from "vitest";

import { getCurrentMonday, getWeekDates, formatDate } from "../utils/helpers";

const initialCurrentWeek = getCurrentMonday(new Date(2024, 5, 10)); // June 10, 2024

const mockGlobalSettingsData = {
  units: ["I.", "II.", "Konyha"],
  groups: ["Süni (A)", "Maci (B)", "Csibe (A)"],
  jobTitles: ["k.gy.n.", "dajka", "szakács"],
  shiftTypes: [
    { code: "DE", name: "Délelőtt", color: "#cce6ff" },
    { code: "DU", name: "Délután", color: "#ffcc99" },
    { code: "TP", name: "Táppénz", color: "#ff9999" },
  ],
  timeSlots: { DE: "6:30-13:50", DU: "9:40-17:00" },
  staffList: [
    {
      id: "s1",
      name: "Nagy Mária",
      defaultUnit: "I.",
      defaultGroup: "Süni (A)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 0,
      employeeNumber: "1",
    },
    {
      id: "s2",
      name: "Kiss Józsefné",
      defaultUnit: "I.",
      defaultGroup: "Süni (A)",
      defaultJobTitle: "dajka",
      isActive: true,
      sortOrder: 1,
      employeeNumber: "2",
    },
    {
      id: "s3",
      name: "Kovács István",
      defaultUnit: "Konyha",
      defaultGroup: "",
      defaultJobTitle: "szakács",
      isActive: true,
      sortOrder: 2,
      employeeNumber: "K1",
    },
    {
      id: "s4",
      name: "Inactive User",
      defaultUnit: "II.",
      defaultGroup: "Csibe (A)",
      defaultJobTitle: "k.gy.n.",
      isActive: false,
      sortOrder: 3,
      employeeNumber: "4",
    },
    {
      id: "s5",
      name: "Varga Pál",
      defaultUnit: "I.",
      defaultGroup: "Maci (B)",
      defaultJobTitle: "k.gy.n.",
      isActive: true,
      sortOrder: 4,
      employeeNumber: "5",
    },
    {
      id: "s6",
      name: "Orphan Test",
      defaultUnit: "Orphaned Unit",
      defaultGroup: "Orphaned Group",
      defaultJobTitle: "Orphaned Job",
      isActive: true,
      sortOrder: 5,
      employeeNumber: "6",
    },
    {
      id: "s7",
      name: "Job Title Sort Test 1",
      defaultUnit: "II.",
      defaultGroup: "Csibe (A)",
      defaultJobTitle: "szakács",
      isActive: true,
      sortOrder: 6,
      employeeNumber: "7",
    }, // same group as s4 (inactive), different job
    {
      id: "s8",
      name: "Job Title Sort Test 2",
      defaultUnit: "II.",
      defaultGroup: "Csibe (A)",
      defaultJobTitle: "dajka",
      isActive: true,
      sortOrder: 7,
      employeeNumber: "8",
    }, // same group, job should sort earlier
  ],
};

const mockWeekDates = getWeekDates(initialCurrentWeek);
const mockWeeklyScheduleData = {
  weekStartDate: initialCurrentWeek.toISOString().split("T")[0],
  staff: [
    {
      staffId: "s1",
      name: "Nagy Mária",
      unit: "I.",
      group: "Süni (A)",
      jobTitle: "k.gy.n.",
      shifts: {
        [formatDate(mockWeekDates[0])]: "DE",
        [formatDate(mockWeekDates[1])]: "DU",
      },
    },
    {
      staffId: "s2",
      name: "Kiss Józsefné Weekly",
      unit: "II.",
      group: "Csibe (A)",
      jobTitle: "k.gy.n.",
      shifts: {
        [formatDate(mockWeekDates[0])]: "TP",
        [formatDate(mockWeekDates[4])]: "DE",
      },
    }, // overrides
    {
      staffId: "s6",
      name: "Orphan Test",
      unit: "Orphaned Unit",
      group: "Orphaned Group",
      jobTitle: "Orphaned Job",
      shifts: { [formatDate(mockWeekDates[0])]: "DE" },
    },
    // s3, s5, s7, s8 use global defaults + empty shifts object
  ],
};

// --- Discrete Logic Testing ---

describe("useStaffData - Discrete Logic Tests", () => {
  // logic similar to getShiftColor
  describe("getShiftColor Logic", () => {
    const getShiftColorLogic = (settings, shiftCode) => {
      if (!settings?.shiftTypes) return "#ffffff";
      const shiftType = settings.shiftTypes.find(
        (type) => type.code === shiftCode,
      );
      return shiftType?.color && typeof shiftType.color === "string"
        ? shiftType.color
        : "#ffffff";
    };

    it("should return correct color for valid codes", () => {
      expect(getShiftColorLogic(mockGlobalSettingsData, "DE")).toBe("#cce6ff");
      expect(getShiftColorLogic(mockGlobalSettingsData, "DU")).toBe("#ffcc99");
      expect(getShiftColorLogic(mockGlobalSettingsData, "TP")).toBe("#ff9999");
    });

    it("should return default color for invalid codes or missing settings", () => {
      expect(getShiftColorLogic(mockGlobalSettingsData, "INVALID")).toBe(
        "#ffffff",
      );
      expect(getShiftColorLogic(mockGlobalSettingsData, null)).toBe("#ffffff");
      expect(getShiftColorLogic({ shiftTypes: [] }, "DE")).toBe("#ffffff"); // empty types
      expect(getShiftColorLogic(null, "DE")).toBe("#ffffff"); // null settings
      expect(getShiftColorLogic({}, "DE")).toBe("#ffffff"); // empty settings object
    });
  });

  // similar to the core of getStaffByUnit
  describe("getStaffByUnit Logic", () => {
    // replicate the core logic of combining, grouping, and sorting
    const getStaffByUnitLogic = (settings, schedule) => {
      if (!settings) return {}; // null settings

      const activeGlobalStaff = (settings.staffList || []).filter(
        (s) => s.isActive,
      );
      if (activeGlobalStaff.length === 0) return {};

      const weeklyStaffDataMap = (schedule?.staff || []).reduce(
        (map, weeklyStaff) => {
          map[weeklyStaff.staffId] = weeklyStaff;
          return map;
        },
        {},
      );

      const validUnits = new Set(settings.units || []);
      const validGroups = new Set(settings.groups || []);
      const validJobTitles = new Set(settings.jobTitles || []);

      const combinedStaffList = activeGlobalStaff.map((globalStaff) => {
        const weeklyData = weeklyStaffDataMap[globalStaff.id];
        const weeklyUnit = weeklyData?.unit;
        const globalUnit = globalStaff.defaultUnit ?? "";
        const effectiveUnit = weeklyUnit ?? globalUnit;
        const isOrphanedUnit = !!weeklyUnit && !validUnits.has(weeklyUnit);

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
          name: weeklyData?.name ?? globalStaff.name,
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
          shifts: weeklyData?.shifts ?? {},
          sortOrder: globalStaff.sortOrder ?? Infinity,
          employeeNumber: globalStaff.employeeNumber ?? "",
        };
      });

      const groupedByUnit = combinedStaffList.reduce((acc, staff) => {
        const unitKey = staff.unit || ""; // empty string for "unassigned" unit
        if (!acc[unitKey]) acc[unitKey] = [];
        acc[unitKey].push(staff);
        return acc;
      }, {});

      // --- Sorting Logic Replication ---
      const createOrderMap = (items = []) =>
        items.reduce((map, item, index) => {
          map[item] = index;
          return map;
        }, {});
      const unitOrderMap = createOrderMap(settings.units);
      const groupOrderMap = createOrderMap(settings.groups);
      const jobTitleOrderMap = createOrderMap(settings.jobTitles);

      const sortedUnitKeys = Object.keys(groupedByUnit).sort((a, b) => {
        const isUnitAValid = validUnits.has(a);
        const isUnitBValid = validUnits.has(b);
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
        if (a === "") return 1;
        if (b === "") return -1;
        if (indexA === Infinity && indexB !== Infinity) return 1;
        if (indexA !== Infinity && indexB === Infinity) return -1;
        if (indexA === Infinity && indexB === Infinity)
          return a.localeCompare(b);
        return indexA - indexB;
      });

      const finalSortedResult = {};
      sortedUnitKeys.forEach((unitKey) => {
        groupedByUnit[unitKey].sort((a, b) => {
          // Group Sort
          const isGroupAOrphaned = a.isOrphanedGroup;
          const isGroupBOrphaned = b.isOrphanedGroup;
          const groupIndexA = !isGroupAOrphaned
            ? (groupOrderMap[a.group || ""] ?? Infinity)
            : Infinity;
          const groupIndexB = !isGroupBOrphaned
            ? (groupOrderMap[b.group || ""] ?? Infinity)
            : Infinity;
          if (groupIndexA !== groupIndexB) {
            if (groupIndexA === Infinity && groupIndexB !== Infinity) return 1;
            if (groupIndexA !== Infinity && groupIndexB === Infinity) return -1;
            return groupIndexA - groupIndexB;
          } else if (isGroupAOrphaned && isGroupBOrphaned) {
            const groupCompare = (a.group || "").localeCompare(b.group || "");
            if (groupCompare !== 0) return groupCompare;
          }

          // Job Title Sort
          const isJobAOrphaned = a.isOrphanedJobTitle;
          const isJobBOrphaned = b.isOrphanedJobTitle;
          const jobIndexA = !isJobAOrphaned
            ? (jobTitleOrderMap[a.jobTitle || ""] ?? Infinity)
            : Infinity;
          const jobIndexB = !isJobBOrphaned
            ? (jobTitleOrderMap[b.jobTitle || ""] ?? Infinity)
            : Infinity;
          if (jobIndexA !== jobIndexB) {
            if (jobIndexA === Infinity && jobIndexB !== Infinity) return 1;
            if (jobIndexA !== Infinity && jobIndexB === Infinity) return -1;
            return jobIndexA - jobIndexB;
          } else if (isJobAOrphaned && isJobBOrphaned) {
            const jobCompare = (a.jobTitle || "").localeCompare(
              b.jobTitle || "",
            );
            if (jobCompare !== 0) return jobCompare;
          }

          // Global Sort Order
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          // name fallback
          return (a.name || "").localeCompare(b.name || "");
        });
        finalSortedResult[unitKey] = groupedByUnit[unitKey];
      });

      return finalSortedResult;
    };

    it("should group active staff by unit, respecting weekly overrides", () => {
      const result = getStaffByUnitLogic(
        mockGlobalSettingsData,
        mockWeeklyScheduleData,
      );

      // check units exist
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(["I.", "II.", "Konyha", "Orphaned Unit"]),
      );
      expect(Object.keys(result).length).toBe(4); // ensure no extra units

      // Check staff in Unit I.
      expect(result["I."].map((s) => s.staffId)).toEqual(["s1", "s5"]); // s1 (weekly data exists), s5 (global default)
      expect(result["I."].find((s) => s.staffId === "s1").name).toBe(
        "Nagy Mária",
      ); // From weekly
      expect(result["I."].find((s) => s.staffId === "s5").name).toBe(
        "Varga Pál",
      ); // From global

      // Check staff in Unit II.
      expect(result["II."].map((s) => s.staffId)).toEqual(["s2", "s8", "s7"]); // s2 (weekly override), s8, s7 (global defaults), sorted by group, then job, then global order
      expect(result["II."].find((s) => s.staffId === "s2").name).toBe(
        "Kiss Józsefné Weekly",
      ); // Weekly override
      expect(result["II."].find((s) => s.staffId === "s2").unit).toBe("II."); // Weekly override
      expect(result["II."].find((s) => s.staffId === "s7").name).toBe(
        "Job Title Sort Test 1",
      ); // Global
      expect(result["II."].find((s) => s.staffId === "s8").name).toBe(
        "Job Title Sort Test 2",
      ); // Global

      // Check staff in Konyha
      expect(result["Konyha"].map((s) => s.staffId)).toEqual(["s3"]); // s3 (global default)

      // Check Orphaned Unit
      expect(result["Orphaned Unit"].map((s) => s.staffId)).toEqual(["s6"]);
    });

    it("should filter out inactive staff", () => {
      const result = getStaffByUnitLogic(
        mockGlobalSettingsData,
        mockWeeklyScheduleData,
      );
      const allStaffIds = Object.values(result)
        .flat()
        .map((s) => s.staffId);
      expect(allStaffIds).not.toContain("s4");
    });

    it("should identify and label orphaned data", () => {
      const result = getStaffByUnitLogic(
        mockGlobalSettingsData,
        mockWeeklyScheduleData,
      );
      const orphanStaff = result["Orphaned Unit"]?.find(
        (s) => s.staffId === "s6",
      );
      expect(orphanStaff).toBeDefined();
      expect(orphanStaff.isOrphanedUnit).toBe(true);
      expect(orphanStaff.displayUnit).toBe("Orphaned Unit (törölt)");
      expect(orphanStaff.isOrphanedGroup).toBe(true);
      expect(orphanStaff.displayGroup).toBe("Orphaned Group (törölt)");
      expect(orphanStaff.isOrphanedJobTitle).toBe(true);
      expect(orphanStaff.displayJobTitle).toBe("Orphaned Job (törölt)");

      // Check a non-orphaned staff member
      const nonOrphanStaff = result["I."]?.find((s) => s.staffId === "s1");
      expect(nonOrphanStaff.isOrphanedUnit).toBe(false);
      expect(nonOrphanStaff.displayUnit).toBe("I.");
    });

    it("should sort units according to global settings order, orphans last", () => {
      const result = getStaffByUnitLogic(
        mockGlobalSettingsData,
        mockWeeklyScheduleData,
      );
      const orderedUnits = Object.keys(result);
      // Expected: Units from settings first, then alphabetically sorted orphans
      expect(orderedUnits).toEqual(["I.", "II.", "Konyha", "Orphaned Unit"]);
    });

    it("should sort staff within units by group, then job title, then global sortOrder", () => {
      const result = getStaffByUnitLogic(
        mockGlobalSettingsData,
        mockWeeklyScheduleData,
      );

      // Unit I: s1 (Süni A, order 0), s5 (Maci B, order 4) -> sorted by group index
      // Group order: Süni (0), Maci (1)
      expect(result["I."].map((s) => s.staffId)).toEqual(["s1", "s5"]);

      // Unit II: s2 (Csibe A, k.gy.n., order 1, weekly override), s8 (Csibe A, dajka, order 7), s7 (Csibe A, szakács, order 6)
      // Group order: Csibe (2) - all same group
      // Job Title order: k.gy.n. (0), dajka (1), szakács (2)
      expect(result["II."].map((s) => s.staffId)).toEqual(["s2", "s8", "s7"]);
    });

    it("should return empty object if settings are null or no active staff", () => {
      expect(getStaffByUnitLogic(null, mockWeeklyScheduleData)).toEqual({});
      const noActiveStaffSettings = {
        ...mockGlobalSettingsData,
        staffList: mockGlobalSettingsData.staffList.map((s) => ({
          ...s,
          isActive: false,
        })),
      };
      expect(
        getStaffByUnitLogic(noActiveStaffSettings, mockWeeklyScheduleData),
      ).toEqual({});
    });
  });

  // Test logic similar to add/remove category items (before saving)
  describe("Category Modification Logic", () => {
    const addCategoryItemLogic = (settings, item, categoryKey) => {
      const trimmedItem = item?.trim();
      if (!settings || !trimmedItem) return settings; // Return original if invalid input

      const currentItems = settings[categoryKey] || [];
      if (
        currentItems.some(
          (existing) => existing.toLowerCase() === trimmedItem.toLowerCase(),
        )
      ) {
        return settings; // Item already exists, return original
      }

      return {
        ...settings,
        [categoryKey]: [...currentItems, trimmedItem],
      };
    };

    const removeCategoryItemLogic = (settings, item, categoryKey) => {
      if (!settings || !item) return settings;
      const currentItems = settings[categoryKey] || [];
      if (!currentItems.includes(item)) {
        return settings; // Item not found, return original
      }
      return {
        ...settings,
        [categoryKey]: currentItems.filter((i) => i !== item),
      };
    };

    it("addCategoryItemLogic should add a new unique item", () => {
      const initialSettings = { units: ["A", "B"], groups: [] };
      const updatedSettings = addCategoryItemLogic(
        initialSettings,
        "C",
        "units",
      );
      expect(updatedSettings.units).toEqual(["A", "B", "C"]);
      expect(updatedSettings.groups).toEqual([]); // other categories unchanged
    });

    it("addCategoryItemLogic should not add duplicate items (case-insensitive)", () => {
      const initialSettings = { units: ["A", "B"] };
      const updatedSettings = addCategoryItemLogic(
        initialSettings,
        " a ",
        "units",
      );
      expect(updatedSettings.units).toEqual(["A", "B"]); // no change
    });

    it("addCategoryItemLogic should handle adding to empty category", () => {
      const initialSettings = { units: ["A"], groups: [] };
      const updatedSettings = addCategoryItemLogic(
        initialSettings,
        "G1",
        "groups",
      );
      expect(updatedSettings.groups).toEqual(["G1"]);
    });

    it("removeCategoryItemLogic should remove an existing item", () => {
      const initialSettings = { units: ["A", "B", "C"] };
      const updatedSettings = removeCategoryItemLogic(
        initialSettings,
        "B",
        "units",
      );
      expect(updatedSettings.units).toEqual(["A", "C"]);
    });

    it("removeCategoryItemLogic should not change if item does not exist", () => {
      const initialSettings = { units: ["A", "C"] };
      const updatedSettings = removeCategoryItemLogic(
        initialSettings,
        "B",
        "units",
      );
      expect(updatedSettings.units).toEqual(["A", "C"]);
    });
  });

  // Test logic similar to staff list modifications (before saving)
  describe("Staff List Modification Logic", () => {
    const addStaffToListLogic = (settings, newStaff) => {
      if (!settings || !newStaff?.id) return settings;
      const currentList = settings.staffList || [];
      if (currentList.some((s) => s.id === newStaff.id)) return settings; // duplicate id

      const staffToAdd = {
        ...newStaff,
        // Ensure default isActive and calculate sortOrder if missing
        isActive: newStaff.isActive !== undefined ? newStaff.isActive : true,
        sortOrder: newStaff.sortOrder ?? currentList.length,
      };

      const newList = [...currentList, staffToAdd].sort(
        (a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity),
      );
      return { ...settings, staffList: newList };
    };

    const updateStaffInListLogic = (settings, updatedStaff) => {
      if (!settings || !updatedStaff?.id) return settings;
      const currentList = settings.staffList || [];
      if (!currentList.some((s) => s.id === updatedStaff.id)) return settings; // staff not found

      const newList = currentList
        .map((staff) =>
          staff.id === updatedStaff.id
            ? { ...staff, ...updatedStaff } // merge existing and new data
            : staff,
        )
        .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

      return { ...settings, staffList: newList };
    };

    const deleteStaffFromListLogic = (settings, staffId) => {
      if (!settings || !staffId) return settings;
      const currentList = settings.staffList || [];
      if (!currentList.some((s) => s.id === staffId)) return settings; // staff not found

      // filter and re-index sortOrder
      const newList = currentList
        .filter((staff) => staff.id !== staffId)
        .map((staff, index) => ({ ...staff, sortOrder: index }));

      return { ...settings, staffList: newList };
    };

    it("addStaffToListLogic should add new staff and assign sortOrder", () => {
      const settings = { staffList: [{ id: "a", sortOrder: 0 }] };
      const newStaff = { id: "b", name: "Staff B" };
      const result = addStaffToListLogic(settings, newStaff);
      expect(result.staffList.length).toBe(2);
      expect(result.staffList[1].id).toBe("b");
      expect(result.staffList[1].sortOrder).toBe(1); // assigned based on length
      expect(result.staffList[1].isActive).toBe(true); // defaulted
    });

    it("updateStaffInListLogic should update existing staff data", () => {
      const settings = {
        staffList: [{ id: "a", name: "Old Name", sortOrder: 0 }],
      };
      const updatedStaff = { id: "a", name: "New Name" };
      const result = updateStaffInListLogic(settings, updatedStaff);
      expect(result.staffList.length).toBe(1);
      expect(result.staffList[0].name).toBe("New Name");
      expect(result.staffList[0].sortOrder).toBe(0); // preserved other fields
    });

    it("deleteStaffFromListLogic should remove staff and re-calculate sortOrder", () => {
      const settings = {
        staffList: [
          { id: "a", name: "A", sortOrder: 0 },
          { id: "b", name: "B", sortOrder: 1 },
          { id: "c", name: "C", sortOrder: 2 },
        ],
      };
      const result = deleteStaffFromListLogic(settings, "b");
      expect(result.staffList.length).toBe(2);
      expect(result.staffList.map((s) => s.id)).toEqual(["a", "c"]);
      expect(result.staffList.find((s) => s.id === "a").sortOrder).toBe(0); // re-indexed
      expect(result.staffList.find((s) => s.id === "c").sortOrder).toBe(1); // re-indexed
    });
  });

  // Test logic similar to weekly schedule updates (before saving)
  describe("Weekly Schedule Update Logic", () => {
    const updateStaffInWeeklyScheduleLogic = (
      schedule,
      staffData,
      weekStartDate,
    ) => {
      if (!staffData?.staffId) return schedule; // Invalid input

      // Ensure schedule is initialized if null/undefined
      const baseSchedule = schedule || {
        weekStartDate: weekStartDate,
        staff: [],
      };

      const existingIndex = baseSchedule.staff.findIndex(
        (s) => s.staffId === staffData.staffId,
      );

      const dataToStore = {
        // Select only relevant weekly fields
        staffId: staffData.staffId,
        name: staffData.name ?? "",
        unit: staffData.unit ?? "",
        group: staffData.group ?? "",
        jobTitle: staffData.jobTitle ?? "",
        shifts: staffData.shifts ?? {},
      };

      let newStaffArray;
      if (existingIndex >= 0) {
        newStaffArray = baseSchedule.staff.map((staff, index) =>
          index === existingIndex ? dataToStore : staff,
        );
      } else {
        newStaffArray = [...baseSchedule.staff, dataToStore];
      }

      return { ...baseSchedule, staff: newStaffArray };
    };

    const removeStaffFromWeeklyScheduleLogic = (schedule, staffId) => {
      if (
        !schedule ||
        !schedule.staff ||
        !schedule.staff.some((s) => s.staffId === staffId)
      ) {
        return schedule;
      }
      return {
        ...schedule,
        staff: schedule.staff.filter((s) => s.staffId !== staffId),
      };
    };

    it("updateStaffInWeeklyScheduleLogic should add a new staff entry", () => {
      const initialSchedule = { weekStartDate: "2024-06-10", staff: [] };
      const newStaffData = {
        staffId: "s1",
        name: "Staff 1",
        shifts: { "2024-06-10": "DE" },
      };
      const result = updateStaffInWeeklyScheduleLogic(
        initialSchedule,
        newStaffData,
        "2024-06-10",
      );
      expect(result.staff.length).toBe(1);
      expect(result.staff[0].staffId).toBe("s1");
      expect(result.staff[0].name).toBe("Staff 1");
      expect(result.staff[0].shifts).toEqual({ "2024-06-10": "DE" });
    });

    it("updateStaffInWeeklyScheduleLogic should update an existing staff entry", () => {
      const initialSchedule = {
        weekStartDate: "2024-06-10",
        staff: [
          {
            staffId: "s1",
            name: "Old Name",
            unit: "Old Unit",
            shifts: { "2024-06-10": "DE" },
          },
        ],
      };
      const updatedStaffData = {
        staffId: "s1",
        name: "New Name",
        unit: "New Unit",
        shifts: { "2024-06-11": "DU" },
      };
      const result = updateStaffInWeeklyScheduleLogic(
        initialSchedule,
        updatedStaffData,
        "2024-06-10",
      );
      expect(result.staff.length).toBe(1);
      expect(result.staff[0].name).toBe("New Name");
      expect(result.staff[0].unit).toBe("New Unit");
      expect(result.staff[0].shifts).toEqual({ "2024-06-11": "DU" }); // shifts object is replaced
    });

    it("removeStaffFromWeeklyScheduleLogic should remove staff entry", () => {
      const initialSchedule = {
        weekStartDate: "2024-06-10",
        staff: [
          { staffId: "s1", name: "A" },
          { staffId: "s2", name: "B" },
        ],
      };
      const result = removeStaffFromWeeklyScheduleLogic(initialSchedule, "s1");
      expect(result.staff.length).toBe(1);
      expect(result.staff[0].staffId).toBe("s2");
    });
  });

  // Test the data transformation part of copyScheduleFromWeek
  describe("copyScheduleFromWeek Data Transformation Logic", () => {
    const transformSourceDataForCopy = (
      sourceStaffList,
      targetWeekDates,
      globalStaffList,
    ) => {
      // Logic extracted from copyScheduleFromWeek hook function
      const activeGlobalStaffMap = (globalStaffList || [])
        .filter((s) => s.isActive)
        .reduce((map, staff) => {
          map[staff.id] = staff;
          return map;
        }, {});

      return (sourceStaffList || [])
        .map((sourceStaff) => {
          const globalStaffInfo = activeGlobalStaffMap[sourceStaff.staffId];
          if (!globalStaffInfo) return null; // skip inactive or non-existent staff

          const newShifts = {};
          const sourceStartDate = new Date(targetWeekDates[0]); // Estimate source start for indexing
          sourceStartDate.setDate(sourceStartDate.getDate() - 7); // Go back 7 days

          targetWeekDates.forEach((targetDate, dayIndex) => {
            const targetDateStr = formatDate(targetDate);

            // find corresponding source day string (approximate by index)
            const sourceDayDate = new Date(sourceStartDate);
            sourceDayDate.setDate(sourceDayDate.getDate() + dayIndex);
            const sourceDayDateStr = formatDate(sourceDayDate);

            newShifts[targetDateStr] =
              sourceStaff.shifts?.[sourceDayDateStr] || "";
          });

          return {
            staffId: sourceStaff.staffId,
            name: sourceStaff.name ?? globalStaffInfo.name, // Use source override or global
            unit: sourceStaff.unit ?? globalStaffInfo.defaultUnit,
            group: sourceStaff.group ?? globalStaffInfo.defaultGroup,
            jobTitle: sourceStaff.jobTitle ?? globalStaffInfo.defaultJobTitle,
            shifts: newShifts,
          };
        })
        .filter((staff) => staff !== null);
    };

    it("should transform source data, map shifts, and filter inactive/non-existent staff", () => {
      const sourceWeekStaff = [
        {
          staffId: "s1",
          name: "Source S1",
          unit: "Src Unit",
          shifts: { "2024.06.03": "DE", "2024.06.04": "DU" },
        }, // active, exists
        { staffId: "s4", name: "Source S4", shifts: { "2024.06.03": "DE" } }, // inactive
        { staffId: "s99", name: "Source S99", shifts: { "2024.06.03": "DE" } }, // doesn't exist in global
        {
          staffId: "s3",
          name: "Source S3",
          jobTitle: "Src Job",
          shifts: { "2024.06.05": "K1" },
        }, // active, exists
      ];
      const targetWeekDatesForTest = getWeekDates(new Date("2024.06.10")); // target week Mon-Sat Date objects
      const globalStaff = mockGlobalSettingsData.staffList; // mock global list

      const result = transformSourceDataForCopy(
        sourceWeekStaff,
        targetWeekDatesForTest,
        globalStaff,
      );

      expect(result.length).toBe(2); // only s1 and s3 should be copied

      const copiedS1 = result.find((s) => s.staffId === "s1");
      expect(copiedS1).toBeDefined();
      expect(copiedS1.name).toBe("Source S1"); // source override name
      expect(copiedS1.unit).toBe("Src Unit"); // source override unit
      expect(copiedS1.group).toBe("Süni (A)"); // global default group (no source override)
      expect(copiedS1.shifts[formatDate(targetWeekDatesForTest[0])]).toBe("DE"); // Mon shift mapped
      expect(copiedS1.shifts[formatDate(targetWeekDatesForTest[1])]).toBe("DU"); // Tue shift mapped
      expect(copiedS1.shifts[formatDate(targetWeekDatesForTest[2])]).toBe(""); // Wed shift empty

      const copiedS3 = result.find((s) => s.staffId === "s3");
      expect(copiedS3).toBeDefined();
      expect(copiedS3.name).toBe("Source S3"); // source override name
      expect(copiedS3.unit).toBe("Konyha"); // global default unit
      expect(copiedS3.jobTitle).toBe("Src Job"); // source override job
      expect(copiedS3.shifts[formatDate(targetWeekDatesForTest[2])]).toBe("K1"); // Wed shift mapped
      expect(copiedS3.shifts[formatDate(targetWeekDatesForTest[0])]).toBe(""); // Mon shift empty
    });
  });
});

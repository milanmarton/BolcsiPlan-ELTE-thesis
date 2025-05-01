# BölcsiPlan (Nursery work schedule planner)

![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.1.0-yellowgreen?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-11.5.0-orange?logo=firebase)
![Vitest](https://img.shields.io/badge/Vitest-3.1.1-6E9F18?logo=vitest)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

A web application designed for planning and managing weekly work schedules for nursery staff. Developed as a thesis project for ELTE BSc. Originally bootstrapped with Create React App, it has been migrated to Vite for improved development experience and performance. Currently only available in Hungarian.

## Table of Contents

-   [Overview](#overview)
-   [Features](#features)
-   [Technology Stack](#technology-stack)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Environment Variables](#environment-variables)
-   [Available Scripts](#available-scripts)
-   [Project Structure](#project-structure)
-   [Key Components & Logic](#key-components--logic)
-   [Firebase Setup](#firebase-setup)
-   [Testing](#testing)
-   [Documentation](#documentation)
-   [Deployment](#deployment)
-   [Potential Future Improvements](#potential-future-improvements)
-   [License](#license)

## Overview

This application provides an interactive interface for nursery administrators or managers to create, view, and modify weekly work schedules for their staff. It utilizes Firebase for user authentication and real-time data storage (Firestore), ensuring that schedules are saved and accessible. The interface displays schedules in a clear table format, grouped by organizational units, and offers tools for managing staff details, shift types, and organizational categories.

## Features

*   **User Authentication:** Secure login and registration using Firebase Authentication (Email/Password). Requires a valid invitation code for registration.
*   **Weekly Schedule View:** Displays staff assignments in a clear, printable grid format (Monday-Saturday).
*   **Week Navigation:** Easily navigate between previous, next, and the current week.
*   **Staff Management:**
    *   Maintain a global list of staff members with core details (name, employee number, default unit/group/job title, active status, sort order).
    *   Edit staff details via a dedicated settings modal.
    *   Add/Remove staff members from the global list.
    *   Reorder staff list using drag-and-drop in settings.
*   **Shift Management:**
    *   Define custom shift types with codes, names, and background colors.
    *   Assign optional time slots (e.g., "08:00-16:00") to shift codes.
    *   Manage shift types via a dedicated modal accessible from the legend.
*   **Category Management:**
    *   Define and manage organizational categories: Units (Egységek), Groups (Csoportok), Job Titles (Munkakörök).
    *   Add/Remove categories globally via the settings modal.
    *   Remove categories directly from the weekly staff editing modal.
    *   Reorder categories using drag-and-drop in settings.
*   **Weekly Overrides:** Assign specific units, groups, and job titles to staff members for a particular week, overriding their global defaults if needed. Useful for handling substitutions.
*   **Shift Assignment:** Assign daily shifts to staff members for the selected week using intuitive dropdowns.
*   **Schedule Copying:** Copy the entire schedule from a previous week (up to 4 weeks prior) to the current week, automatically mapping shifts to the correct target dates.
*   **Data Persistence:** All settings and weekly schedules are stored in Firebase Firestore.
*   **Real-time Updates:** Utilizes Firestore listeners (`onSnapshot`) to reflect data changes in real-time (primarily for settings, weekly data reloads on week change or save).
*   **Printable View:** Optimized print styles (`index.css`) for generating clean A4 schedule printouts.
*   **Responsive Design:** Built with Tailwind CSS for adaptability across different screen sizes.
*   **Loading & Error States:** Provides visual feedback during data loading and displays clear error messages.
*   **Demo Data:** Option to load pre-defined demonstration data for settings and staff via the Settings modal.
*   **Orphaned Data Highlighting:** Visually indicates (e.g., red italics) when a staff member's assigned unit, group, or job title for the week corresponds to a category that has been deleted from the global settings.

## Technology Stack

*   **Frontend Framework:** React 19
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS, PostCSS, Autoprefixer
*   **State Management:** React Context API (`AuthContext`), Custom Hooks (`useStaffData`), Component State (`useState`, `useMemo`, `useCallback`)
*   **Backend & Database:** Firebase (Authentication, Cloud Firestore)
*   **Routing:** Implicitly handled by component structure, no dedicated router library is being used
*   **Icons:** Lucide React
*   **Testing:** Vitest, React Testing Library, jsdom
*   **Documentation:** TypeDoc (utilizing JSDoc comments)
*   **Language:** JavaScript (JSX), TypeScript configured (potentially for type checking/future migration)

## Prerequisites

*   Node.js (LTS version recommended)
*   npm, yarn, or pnpm
*   A Firebase project

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd nurse-scheduler
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

## Environment Variables

This project requires Firebase configuration keys and an invitation code stored in environment variables.

1.  Create a `.env` file in the root of the project.
2.  Add the following variables, replacing the placeholder values with your actual Firebase project credentials and a chosen invitation code:

    ```plaintext
    # .env

    # Firebase Configuration
    VITE_FIREBASE_API_KEY=YOUR_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID=YOUR_APP_ID

    # Registration Invitation Code
    VITE_INVITATION_CODE=YOUR_SECRET_INVITATION_CODE
    ```

    **Important:** Never commit your `.env` file to version control. Ensure it's listed in your `.gitignore` file.

## Available Scripts

In the project directory, you can run the following scripts:

*   `npm run dev` or `yarn dev` or `pnpm dev`:
    Runs the app in development mode using Vite. Opens automatically in your default browser at `http://localhost:5173` (or the configured port).

*   `npm run build` or `yarn build` or `pnpm build`:
    Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

*   `npm run preview` or `yarn preview` or `pnpm preview`:
    Serves the production build from the `dist` folder locally. Useful for testing the build before deployment.

*   `npm run test` or `yarn test` or `pnpm test`:
    Runs tests using Vitest in the console.

*   `npm run test:ui` or `yarn test:ui` or `pnpm test:ui`:
    Runs tests using Vitest with its interactive UI.

*   `npm run docs` or `yarn docs` or `pnpm docs`:
    Generates project documentation using TypeDoc based on JSDoc comments. The output is placed in the `docs` folder.

## Project Structure

```
nurse-scheduler/
├── public/ # Static assets, manifest, icons, robots.txt
├── src/ # Source code
│ ├── components/ # Reusable React components (UI elements, modals)
│ ├── contexts/ # React Context providers (e.g., AuthContext)
│ ├── hooks/ # Custom React Hooks (e.g., useStaffData for data logic)
│ ├── utils/ # Utility functions (e.g., date helpers)
│ ├── App.jsx # Main application component orchestrating layout and state
│ ├── firebaseConfig.js # Firebase initialization
│ ├── index.css # Tailwind CSS setup and global/print styles
│ └── index.jsx # Application entry point
├── .env.example # Example environment variable file
├── .gitignore # Git ignore configuration
├── index.html # Main HTML template (Vite entry)
├── package.json # Project metadata and dependencies
├── postcss.config.mjs # PostCSS configuration (for Tailwind)
├── README.md # This file
├── tailwind.config.mjs # Tailwind CSS configuration
├── tsconfig.json # TypeScript configuration (for JS/JSX linting or future use)
├── typedoc.json # TypeDoc configuration
└── vite.config.mjs # Vite configuration
```

## Key Components & Logic

*   **`App.jsx`:** The root component that manages overall layout, routing (implicit), modal visibility, week navigation state, and integrates core hooks and components. Handles top-level loading/error states.
*   **`hooks/useStaffData.js`:** A crucial custom hook responsible for all interactions with Firestore for both global settings (staff list, categories, shifts) and weekly schedule data. Manages loading states, error handling, real-time listeners (`onSnapshot`), data transformation (`getStaffByUnit`), and provides functions for CRUD operations and schedule copying.
*   **`contexts/AuthContext.jsx`:** Manages Firebase authentication state (`currentUser`) and provides `login`, `signup`, and `logout` functions.
*   **`components/ScheduleTable.jsx`:** Displays the main weekly schedule grid, rendering staff rows grouped by unit and highlighting orphaned data.
*   **`components/SettingsModal.jsx`:** A comprehensive modal for managing all global settings: Units, Groups, Job Titles, and the Staff List (including drag-and-drop reordering and editing via `StaffEditSubModal`). Also allows loading demo data.
*   **`components/StaffModal.jsx`:** Modal for editing a *single staff member's* details *for a specific week* (weekly unit/group/job title overrides, daily shifts). Allows adding/removing global categories directly.
*   **`components/ShiftTypesModal.jsx`:** Modal for managing global shift types (code, name, color) and their associated time slots.
*   **`components/StaffEditSubModal.jsx`:** A sub-modal used *within* `SettingsModal` for editing the *core* details of a staff member in the global list.
*   **`components/LoginPage.jsx`:** Handles user login and registration forms, including invitation code validation for signup.
*   **`utils/helpers.js`:** Contains helper functions for date formatting, week calculations, and color contrast.

## Firebase Setup

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Register Web App:** Add a Web App to your Firebase project. Copy the `firebaseConfig` object provided during setup.
3.  **Enable Authentication:** In the Firebase Console, navigate to `Authentication` -> `Sign-in method` and enable the `Email/Password` provider.
4.  **Enable Firestore:** Navigate to `Firestore Database` and create a database. Start in **Production mode** (recommended) or Test mode (ensure you understand the security implications).
5.  **Configure Firestore Rules:** **Crucially**, you need to set up Firestore Security Rules to control access to your data. By default (in Production mode), all reads/writes are denied. You'll need rules that allow authenticated users to read/write their own data under `userSchedules/{userId}`. Example (basic - **review and adapt carefully for production security needs**):
    ```javascript
    // Firestore Security Rules
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow authenticated users to read/write their own schedule data
        match /userSchedules/{userId}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
6.  **Environment Variables:** Copy your Firebase project credentials (`apiKey`, `authDomain`, etc.) into the `.env` file as described in the [Environment Variables](#environment-variables) section.

## Testing

The project is configured with Vitest for unit and integration testing.

*   Run tests once: `npm test`
*   Run tests with interactive UI: `npm run test:ui`

Test files should be located alongside the components or logic they test, typically ending in `.test.js` or `.spec.js`.

## Documentation

The project uses TypeDoc, configured via `typedoc.json`, to generate documentation from JSDoc comments within the code.

*   Generate documentation: `npm run docs`
*   The output will be generated in the `/docs` directory. Open `docs/index.html` to view the documentation.

## Deployment

1.  **Build the project:**
    ```bash
    npm run build
    ```
2.  The optimized production build will be located in the `/dist` directory.
3.  Deploy the contents of the `/dist` folder to your preferred static hosting provider (e.g., Firebase Hosting, Netlify, Vercel, GitHub Pages). Configure the hosting service to handle single-page application routing (direct all routes to `index.html`).

    *   **Firebase Hosting:** Refer to the [Firebase Hosting documentation](https://firebase.google.com/docs/hosting). Initialize Firebase hosting, configure `firebase.json` for SPA routing, and deploy using `firebase deploy`.

## License

This project is licensed under the ISC License. See the `package.json` file for details.

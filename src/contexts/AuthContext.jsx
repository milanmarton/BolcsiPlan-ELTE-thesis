import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

/**
 * @typedef {object} AuthContextType
 * @property {User | null} currentUser - The currently authenticated Firebase user object, or null if no user is logged in.
 * @property {(email: string, password: string) => Promise<import("firebase/auth").UserCredential>} signup - Function to register a new user.
 * @property {(email: string, password: string) => Promise<import("firebase/auth").UserCredential>} login - Function to log in an existing user.
 * @property {() => Promise<void>} logout - Function to log out the current user.
 */

/**
 * @const {React.Context<AuthContextType | undefined>} AuthContext
 * Context object for providing and consuming authentication state and functions.
 * Initial value is undefined to ensure it's used within an AuthProvider.
 */
const AuthContext = createContext(undefined);

/**
 * @function useAuth
 * Custom hook to easily access the authentication context (currentUser, login, signup, logout).
 * Throws an error if used outside of an `AuthProvider`.
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If the hook is not used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * @typedef {object} AuthProviderProps
 * @property {ReactNode} children - The child components that need access to the authentication context.
 */

/**
 * Provides authentication state and functions to its children via context.
 * It initializes Firebase authentication listeners and manages the current user state.
 *
 * @param {AuthProviderProps} props - The properties for the AuthProvider component.
 * @returns {JSX.Element} The provider component wrapping the children.
 */
export function AuthProvider({ children }) {
  // ==========================================================================
  // State
  // ==========================================================================

  /**
   * @state {User | null} currentUser - Stores the currently logged-in Firebase user object, or null if logged out.
   */
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * @state {boolean} loading - Indicates whether the initial authentication state check is complete.
   * Prevents rendering children until the user's status is determined.
   */
  const [loading, setLoading] = useState(true);

  // ==========================================================================
  // Authentication Functions
  // ==========================================================================

  /**
   * @function signup
   * Registers a new user with email and password using Firebase Authentication.
   * @param {string} email - The user's email address.
   * @param {string} password - The user's chosen password.
   * @returns {Promise<import("firebase/auth").UserCredential>} A promise resolving with the user credential upon successful registration.
   */
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  /**
   * @function login
   * Logs in an existing user with email and password using Firebase Authentication.
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @returns {Promise<import("firebase/auth").UserCredential>} A promise resolving with the user credential upon successful login.
   */
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * @function logout
   * Logs out the currently authenticated user from Firebase Authentication.
   * @returns {Promise<void>} A promise that resolves when the user is successfully logged out.
   */
  function logout() {
    return signOut(auth);
  }

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * @effect Sets up a listener for Firebase authentication state changes.
   * Updates the `currentUser` state when the user logs in or out.
   * Sets `loading` to false once the initial auth state is determined.
   * Cleans up the listener on component unmount.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only once on mount

  // ==========================================================================
  // Context Value & Provider Render
  // ==========================================================================

  /**
   * @const {AuthContextType} value
   * The value object provided to the AuthContext. Contains the current user
   * and the core authentication functions.
   */
  const value = {
    currentUser,
    login,
    signup,
    logout,
  };

  /**
   * Renders the AuthContext.Provider, passing down the authentication value.
   * Conditionally renders children only after the initial loading state is false
   * to prevent UI flashes or access issues before auth state is known.
   */
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

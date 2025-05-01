import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../firebaseConfig", () => ({
  auth: {},
}));

const AuthConsumerComponent = ({ onRender }) => {
  const auth = useAuth();
  useEffect(() => {
    if (onRender) {
      onRender(auth);
    }
  }, [auth, onRender]);
  return (
    <div>
      Current User: {auth.currentUser ? auth.currentUser.uid : "None"}
      <button onClick={() => auth.login("test@example.com", "password")}>
        Login
      </button>
      <button onClick={() => auth.signup("test@example.com", "password")}>
        Signup
      </button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  let onAuthStateChangedCallback = null;
  let mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChanged.mockImplementation((auth, callback) => {
      onAuthStateChangedCallback = callback;
      // use setTimeout to ensure initial loading state is testable
      setTimeout(() => {
        act(() => {
          if (onAuthStateChangedCallback) {
            onAuthStateChangedCallback(null); // simulate initial state (logged out)
          }
        });
      }, 0);
      return mockUnsubscribe;
    });

    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "login-uid" },
    });
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "signup-uid" },
    });
    signOut.mockResolvedValue(undefined);
  });

  it("should update currentUser when onAuthStateChanged fires with a user", async () => {
    let capturedAuth = null;
    render(
      <AuthProvider>
        <AuthConsumerComponent onRender={(auth) => (capturedAuth = auth)} />
      </AuthProvider>,
    );

    await waitFor(() => expect(capturedAuth?.currentUser).toBeNull());

    const mockUser = { uid: "test-uid", email: "test@example.com" };
    // simulate Firebase firing the callback with a logged-in user
    act(() => {
      if (onAuthStateChangedCallback) {
        onAuthStateChangedCallback(mockUser);
      }
    });

    await waitFor(() => expect(capturedAuth?.currentUser).toEqual(mockUser));
    expect(capturedAuth?.currentUser?.uid).toBe("test-uid");
  });

  it("should update currentUser to null when onAuthStateChanged fires with null", async () => {
    let capturedAuth = null;
    const mockUser = { uid: "test-uid", email: "test@example.com" };

    // setup initial state with a user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      onAuthStateChangedCallback = callback;
      setTimeout(() => {
        act(() => {
          if (onAuthStateChangedCallback) {
            onAuthStateChangedCallback(mockUser);
          }
        });
      }, 0);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <AuthConsumerComponent onRender={(auth) => (capturedAuth = auth)} />
      </AuthProvider>,
    );

    await waitFor(() => expect(capturedAuth?.currentUser).toEqual(mockUser));

    // simulate Firebase firing the callback with null (logout)
    act(() => {
      if (onAuthStateChangedCallback) {
        onAuthStateChangedCallback(null);
      }
    });

    await waitFor(() => expect(capturedAuth?.currentUser).toBeNull());
  });

  it("should call signInWithEmailAndPassword on login", async () => {
    let capturedAuth = null;
    render(
      <AuthProvider>
        <AuthConsumerComponent onRender={(auth) => (capturedAuth = auth)} />
      </AuthProvider>,
    );
    await waitFor(() => expect(capturedAuth).not.toBeNull());

    await act(async () => {
      await capturedAuth?.login("user@test.com", "pass123");
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "user@test.com",
      "pass123",
    );
  });

  it("should call createUserWithEmailAndPassword on signup", async () => {
    let capturedAuth = null;
    render(
      <AuthProvider>
        <AuthConsumerComponent onRender={(auth) => (capturedAuth = auth)} />
      </AuthProvider>,
    );
    await waitFor(() => expect(capturedAuth).not.toBeNull());

    await act(async () => {
      await capturedAuth?.signup("new@test.com", "newpass");
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "new@test.com",
      "newpass",
    );
  });

  it("should call signOut on logout", async () => {
    let capturedAuth = null;
    render(
      <AuthProvider>
        <AuthConsumerComponent onRender={(auth) => (capturedAuth = auth)} />
      </AuthProvider>,
    );
    await waitFor(() => expect(capturedAuth).not.toBeNull());

    await act(async () => {
      await capturedAuth?.logout();
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith(expect.anything());
  });

  it("should unsubscribe from onAuthStateChanged on unmount", () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>,
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

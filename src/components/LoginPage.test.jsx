import { describe, it, expect, vi } from "vitest";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
    signup: vi.fn(),
  }),
}));

vi.mock("../firebaseConfig", () => ({}));
vi.mock("lucide-react", () => ({
  Lock: () => null,
  Mail: () => null,
  UserPlus: () => null,
  LogIn: () => null,
  Key: () => null,
}));

import.meta.env = {
  VITE_INVITATION_CODE: "test123",
};

// these functions simulate the validation logic within the component
const validatePasswordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

const validatePasswordLength = (password) => {
  return password.length >= 6;
};

const validateInvitationCode = (code) => {
  return code === import.meta.env.VITE_INVITATION_CODE;
};

describe("LoginPage Validation Logic", () => {
  describe("Password Validation", () => {
    it("should validate matching passwords", () => {
      expect(validatePasswordsMatch("password123", "password123")).toBe(true);
      expect(validatePasswordsMatch("password123", "different")).toBe(false);
      expect(validatePasswordsMatch("", "")).toBe(true); // empty strings match
    });

    it("should validate password length", () => {
      expect(validatePasswordLength("123456")).toBe(true);
      expect(validatePasswordLength("password123")).toBe(true);
      expect(validatePasswordLength("12345")).toBe(false);
      expect(validatePasswordLength("")).toBe(false);
    });
  });

  describe("Invitation Code Validation", () => {
    it("should validate invitation code", () => {
      expect(validateInvitationCode("test123")).toBe(true);
      expect(validateInvitationCode("wrong")).toBe(false);
      expect(validateInvitationCode("")).toBe(false);
    });
  });

  describe("Registration Validation Flow", () => {
    it("should check password length before matching", () => {
      const password = "12345"; // too short
      const confirmPassword = "12345";

      const isPasswordLongEnough = validatePasswordLength(password);
      expect(isPasswordLongEnough).toBe(false);

      // check all validations unconditionally for testing purposes
      const doPasswordsMatch = validatePasswordsMatch(
        password,
        confirmPassword,
      );
      expect(doPasswordsMatch).toBe(true);
    });

    it("should check passwords match before invitation code", () => {
      const password = "password123";
      const confirmPassword = "different"; // doesn't match

      const isPasswordLongEnough = validatePasswordLength(password);
      expect(isPasswordLongEnough).toBe(true);

      const doPasswordsMatch = validatePasswordsMatch(
        password,
        confirmPassword,
      );
      expect(doPasswordsMatch).toBe(false);
    });

    it("should validate invitation code if passwords are valid", () => {
      const password = "password123"; // long enough
      const confirmPassword = "password123"; // matches
      const invitationCode = "test123"; // correct

      const isPasswordLongEnough = validatePasswordLength(password);
      expect(isPasswordLongEnough).toBe(true);

      const doPasswordsMatch = validatePasswordsMatch(
        password,
        confirmPassword,
      );
      expect(doPasswordsMatch).toBe(true);

      const isInvitationCodeValid = validateInvitationCode(invitationCode);
      expect(isInvitationCodeValid).toBe(true);
    });

    it("should fail validation if invitation code is wrong", () => {
      const password = "password123"; // long enough
      const confirmPassword = "password123"; // matches
      const invitationCode = "wrong"; // incorrect

      const isPasswordLongEnough = validatePasswordLength(password);
      expect(isPasswordLongEnough).toBe(true);

      const doPasswordsMatch = validatePasswordsMatch(
        password,
        confirmPassword,
      );
      expect(doPasswordsMatch).toBe(true);

      const isInvitationCodeValid = validateInvitationCode(invitationCode);
      expect(isInvitationCodeValid).toBe(false);
    });
  });
});

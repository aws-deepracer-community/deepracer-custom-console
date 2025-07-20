import { describe, it, expect, beforeEach } from "vitest";
import * as ValidationUtils from "../../../components/settings/validation-utils";

describe("validation-utils", () => {
  describe("validateOldPassword", () => {
    beforeEach(() => {
      // Reset the error state before each test by re-importing the module
      // This ensures each test starts with a clean state
    });

    it("should set oldPasswordError to false when old password is provided and oldPasswordChanged is false", () => {
      const result = ValidationUtils.validateOldPassword("mypassword", false);
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.oldPasswordError).toBe(false);
    });

    it("should set oldPasswordError to false when old password is provided and oldPasswordChanged is true", () => {
      const result = ValidationUtils.validateOldPassword("mypassword", true);
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.oldPasswordError).toBe(false);
    });

    it("should set oldPasswordError to false when old password is empty and oldPasswordChanged is false", () => {
      const result = ValidationUtils.validateOldPassword("", false);
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.oldPasswordError).toBe(false);
    });

    it("should return error message when old password is empty and oldPasswordChanged is true", () => {
      const result = ValidationUtils.validateOldPassword("", true);
      
      expect(result).toBe("Old password is required");
      expect(ValidationUtils.oldPasswordError).toBe(true);
    });

    it("should use default value for oldPasswordChanged parameter", () => {
      const result = ValidationUtils.validateOldPassword("mypassword");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.oldPasswordError).toBe(false);
    });
  });

  describe("validateNewPassword", () => {
    beforeEach(() => {
      // Reset the error state before each test
    });

    it("should return undefined when password is empty", () => {
      const result = ValidationUtils.validateNewPassword("");
      
      expect(result).toBeUndefined();
      // Error state should remain unchanged when password is empty
    });

    it("should return error message when password is too short", () => {
      const result = ValidationUtils.validateNewPassword("short");
      
      expect(result).toBe("Password must be at least 8 characters long");
      expect(ValidationUtils.newPasswordError).toBe(true);
    });

    it("should return error message when password lacks numbers", () => {
      const result = ValidationUtils.validateNewPassword("LongPassword");
      
      expect(result).toBe("Password must contain at least one number");
      expect(ValidationUtils.newPasswordError).toBe(true);
    });

    it("should return error message when password lacks uppercase characters", () => {
      const result = ValidationUtils.validateNewPassword("longpassword123");
      
      expect(result).toBe("Password must contain at least one uppercase character");
      expect(ValidationUtils.newPasswordError).toBe(true);
    });

    it("should return error message when password lacks lowercase characters", () => {
      const result = ValidationUtils.validateNewPassword("LONGPASSWORD123");
      
      expect(result).toBe("Password must contain at least one lowercase character");
      expect(ValidationUtils.newPasswordError).toBe(true);
    });

    it("should set newPasswordError to false and return undefined for valid password", () => {
      const result = ValidationUtils.validateNewPassword("ValidPassword123");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.newPasswordError).toBe(false);
    });

    it("should validate password with all character types", () => {
      const result = ValidationUtils.validateNewPassword("MySecure123!");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.newPasswordError).toBe(false);
    });

    it("should validate minimum length password with all requirements", () => {
      const result = ValidationUtils.validateNewPassword("Abc123de");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.newPasswordError).toBe(false);
    });
  });

  describe("validateConfirmPassword", () => {
    beforeEach(() => {
      // Reset the error state before each test
    });

    it("should set confirmPasswordError to true when new password is empty", () => {
      const result = ValidationUtils.validateConfirmPassword("", "anything");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.confirmPasswordError).toBe(true);
    });

    it("should return error message when passwords do not match", () => {
      const result = ValidationUtils.validateConfirmPassword("password123", "differentPassword");
      
      expect(result).toBe("New password and confirm password do not match");
      expect(ValidationUtils.confirmPasswordError).toBe(true);
    });

    it("should set confirmPasswordError to false when passwords match", () => {
      const result = ValidationUtils.validateConfirmPassword("MyPassword123", "MyPassword123");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.confirmPasswordError).toBe(false);
    });

    it("should handle empty confirm password when new password is provided", () => {
      const result = ValidationUtils.validateConfirmPassword("MyPassword123", "");
      
      expect(result).toBe("New password and confirm password do not match");
      expect(ValidationUtils.confirmPasswordError).toBe(true);
    });

    it("should handle special characters in matching passwords", () => {
      const result = ValidationUtils.validateConfirmPassword("P@ssw0rd!", "P@ssw0rd!");
      
      expect(result).toBeUndefined();
      expect(ValidationUtils.confirmPasswordError).toBe(false);
    });

    it("should be case sensitive when comparing passwords", () => {
      const result = ValidationUtils.validateConfirmPassword("Password123", "password123");
      
      expect(result).toBe("New password and confirm password do not match");
      expect(ValidationUtils.confirmPasswordError).toBe(true);
    });
  });

  describe("getColorRgb", () => {
    it("should convert RGB values to hex color code", () => {
      const rgb = { r: 255, g: 0, b: 0 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#ff0000");
    });

    it("should handle RGB values with leading zeros", () => {
      const rgb = { r: 0, g: 15, b: 255 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#000fff");
    });

    it("should convert RGB to hex for white color", () => {
      const rgb = { r: 255, g: 255, b: 255 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#ffffff");
    });

    it("should convert RGB to hex for black color", () => {
      const rgb = { r: 0, g: 0, b: 0 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#000000");
    });

    it("should handle mid-range RGB values", () => {
      const rgb = { r: 128, g: 64, b: 192 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#8040c0");
    });

    it("should handle RGB values that result in single digit hex", () => {
      const rgb = { r: 1, g: 2, b: 3 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#010203");
    });

    it("should handle maximum RGB values", () => {
      const rgb = { r: 255, g: 255, b: 255 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#ffffff");
    });

    it("should handle arbitrary RGB combinations", () => {
      const rgb = { r: 76, g: 175, b: 80 };
      const result = ValidationUtils.getColorRgb(rgb);
      
      expect(result).toBe("#4caf50");
    });
  });

  describe("error state integration", () => {
    it("should maintain independent error states across validation functions", () => {
      // Set up initial states
      ValidationUtils.validateNewPassword("short"); // Should set newPasswordError to true
      ValidationUtils.validateConfirmPassword("pass1", "pass2"); // Should set confirmPasswordError to true
      ValidationUtils.validateOldPassword("", true); // Should set oldPasswordError to true
      
      expect(ValidationUtils.newPasswordError).toBe(true);
      expect(ValidationUtils.confirmPasswordError).toBe(true);
      expect(ValidationUtils.oldPasswordError).toBe(true);
      
      // Validate one function should not affect others
      ValidationUtils.validateNewPassword("ValidPassword123");
      expect(ValidationUtils.newPasswordError).toBe(false);
      expect(ValidationUtils.confirmPasswordError).toBe(true); // Should remain unchanged
      expect(ValidationUtils.oldPasswordError).toBe(true); // Should remain unchanged
    });

    it("should reset individual error states when validation passes", () => {
      // Set all errors to true
      ValidationUtils.validateNewPassword("short");
      ValidationUtils.validateConfirmPassword("pass1", "pass2");
      ValidationUtils.validateOldPassword("", true);
      
      // Clear errors one by one
      ValidationUtils.validateOldPassword("oldpass", true);
      expect(ValidationUtils.oldPasswordError).toBe(false);
      expect(ValidationUtils.newPasswordError).toBe(true);
      expect(ValidationUtils.confirmPasswordError).toBe(true);
      
      ValidationUtils.validateNewPassword("ValidPassword123");
      expect(ValidationUtils.oldPasswordError).toBe(false);
      expect(ValidationUtils.newPasswordError).toBe(false);
      expect(ValidationUtils.confirmPasswordError).toBe(true);
      
      ValidationUtils.validateConfirmPassword("ValidPassword123", "ValidPassword123");
      expect(ValidationUtils.oldPasswordError).toBe(false);
      expect(ValidationUtils.newPasswordError).toBe(false);
      expect(ValidationUtils.confirmPasswordError).toBe(false);
    });
  });
});

export let oldPasswordError = true;
export const validateOldPassword = (oldPassword: string, oldPasswordChanged: boolean = false) => {
  if (oldPassword.length === 0 && oldPasswordChanged) {
    oldPasswordError = true;
    return "Old password is required";
  } else {
    oldPasswordError = false;
  }
};

export let newPasswordError = true;
export const validateNewPassword = (password: string) => {
  if (password.length === 0) {
    return;
  }
  if (password.length < 8) {
    newPasswordError = true;
    return "Password must be at least 8 characters long";
  }
  if (!/\d/.test(password)) {
    newPasswordError = true;
    return "Password must contain at least one number";
  }
  if (!/[A-Z]/.test(password)) {
    newPasswordError = true;
    return "Password must contain at least one uppercase character";
  }
  if (!/[a-z]/.test(password)) {
    newPasswordError = true;
    return "Password must contain at least one lowercase character";
  }
  newPasswordError = false;
  return;
};

export let confirmPasswordError = true;
export const validateConfirmPassword = (newPassword: string, confirmPassword: string) => {
  if (newPassword.length === 0) {
    confirmPasswordError = true;
    return;
  }
  if (newPassword !== confirmPassword) {
    confirmPasswordError = true;
    return "New password and confirm password do not match";
  }
  confirmPasswordError = false;
  return;
};

interface Rgb {
  r: number;
  g: number;
  b: number;
}
export const getColorRgb = (rgb: Rgb) => {  const hexcode: string =
    "#" + [rgb.r, rgb.g, rgb.b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return hexcode;
};

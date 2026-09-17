export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === "") return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Must be a valid email address";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/\d/.test(password)) return "Password must contain at least one digit";
  return null;
};

export const validateFullName = (fullName: string): string | null => {
  if (!fullName || fullName.trim() === "") return "Full name is required";
  if (fullName.trim().length < 2) return "Full name must be at least 2 characters";
  if (fullName.trim().length > 80) return "Full name must be at most 80 characters";
  return null;
};

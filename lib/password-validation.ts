export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common weak passwords
  const weakPasswords = [
    'password',
    '12345678',
    'qwerty123',
    'admin123',
    'letmein',
  ];

  if (weakPasswords.some((weak) => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common or weak');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

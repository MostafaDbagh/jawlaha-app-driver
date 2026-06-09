// Ported from core/functions/validtion.dart (Validator) + string_fun.dart
import { t } from '@/i18n';
import { AppColors } from '@/theme';

export function replaceArabicNumber(input: string): string {
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let out = input;
  for (let i = 0; i < arabic.length; i++) {
    out = out.split(arabic[i]).join(english[i]);
  }
  return out;
}

const EMAIL_RE = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;

export interface PasswordValidatorModel {
  strength: number; // 0..1
  message: string; // local key
  color?: string;
}

export const Validator = {
  emptyText(value?: string | null, validMessage = 'field_required'): string | null {
    if (value == null || value.trim().length === 0) return t(validMessage);
    return null;
  },

  numberValid(value: string, validMessage = 'plz_enter_valid_number'): string | null {
    if (!NUM_RE.test(value.trim())) return t(validMessage);
    return null;
  },

  // Syrian mobile number, entered without the +963 dial code (shown separately).
  // Valid form: 9 digits starting with 9 (i.e. domestic 09XXXXXXXX without the 0).
  phoneNumberValid(value?: string | null, validMessage = 'plz_enter_valid_phone_number'): string | null {
    if (value == null) return t(validMessage);
    const v = replaceArabicNumber(value).trim().replace(/^\+/, '');
    if (v.length === 0 || /\D/.test(v)) return t(validMessage);
    if (v.startsWith('0')) return t('phone_no_leading_zero');
    if (v.length !== 9 || !v.startsWith('9')) return t('phone_invalid_length');
    return null;
  },

  emailValid(value?: string | null, validMessage = 'plz_enter_valid_email'): string | null {
    if (value == null || !EMAIL_RE.test(value.trim())) return t(validMessage);
    return null;
  },

  // Ported from validtion.dart validatePasswordForPasswordModel.
  // Faithful to the Dart: compares the value against the password-strength
  // message keys (password_good / password_strong), else returns the
  // validation_password_strong message; finally falls back to emptyText.
  validatePasswordForPasswordModel(value: string): string | null {
    if (!(value === 'password_good' || value === 'password_strong')) {
      return t('validation_password_strong');
    }
    return this.emptyText(value);
  },

  matchPassword(value1: string, value2: string, validMessage = 'password_not_match'): string | null {
    if (value1.trim() !== value2.trim() || value1.length === 0 || value2.length === 0) {
      return t(validMessage);
    }
    return null;
  },

  customValidator(condition: boolean | null | undefined, validMessage = 'field_required'): string | null {
    if (condition) return t(validMessage);
    return null;
  },

  checkPassword(value: string): PasswordValidatorModel {
    const password = value.trim();
    const pattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$&*~]).{8,}$/;
    if (password.length === 0) {
      return { strength: 0, message: 'plz_enter_valid_password' };
    } else if (password.length < 8) {
      return { strength: 1 / 3, message: 'password_acceptable_strong', color: AppColors.yellow };
    } else if (!pattern.test(password)) {
      return { strength: 2 / 3, message: 'password_good', color: AppColors.blue };
    }
    return { strength: 1, message: 'password_strong', color: AppColors.lightGreen };
  },
};

import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Same rules as backend: optional +91, then 10 digits starting 6–9. */
export function normalizeIndianMobileInput(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  let s = String(raw).replace(/\s/g, '').trim();
  if (!s) return null;
  if (s.startsWith('+91')) s = s.slice(3);
  else if (s.startsWith('91') && s.length === 12) s = s.slice(2);
  if (!/^[6-9]\d{9}$/.test(s)) return null;
  return s;
}

export function indianMobileValidator(
  control: AbstractControl
): ValidationErrors | null {
  const v = control.value;
  if (v == null || String(v).trim() === '') {
    return null;
  }
  return normalizeIndianMobileInput(v) ? null : { indianMobile: true };
}

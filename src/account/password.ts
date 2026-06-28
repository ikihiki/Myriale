import type { PasswordRequirement } from './types';

export const defaultPasswordRequirements: PasswordRequirement[] = [
  { id: 'length', label: '8文字以上', test: (value) => value.length >= 8 },
  { id: 'letter', label: '英字を含む', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'number', label: '数字を含む', test: (value) => /[0-9]/.test(value) },
];

export function passwordStrength(value: string, requirements = defaultPasswordRequirements): number {
  return requirements.filter((requirement) => requirement.test(value)).length;
}

export function strengthLabel(strength: number, total: number): string {
  if (strength === 0) return 'これから入力';
  if (strength <= 1) return '弱い';
  if (strength < total) return 'ふつう';
  return '要件を満たしています';
}

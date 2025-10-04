import { useMemo } from 'react';

export default function usePasswordRules(password='') {
  const rules = useMemo(() => {
    return {
      length: password.length >= 8,
      numberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
      lowerUpper: /[a-z]/.test(password) && /[A-Z]/.test(password),
    };
  }, [password]);
  return rules;
}

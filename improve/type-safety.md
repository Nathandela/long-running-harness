# Type Safety Tightening

## Goal
Find and fix TypeScript type safety gaps across the codebase. Focus on:
1. Any use of `any` type (replace with proper types)
2. Missing return type annotations on exported functions
3. Unchecked array/map index access (should be caught by noUncheckedIndexedAccess but verify)
4. AudioParam value assignments without range validation
5. MessagePort message handlers without discriminated union type narrowing
6. SharedArrayBuffer access without proper DataView/TypedArray typing
7. Zod schema gaps where runtime data enters the system (MIDI input, file import, session load)

After each check, fix violations found. Output `IMPROVED` if fixes were made and type check passes. Output `NO_IMPROVEMENT` if no type safety gaps remain. Output `FAILED` if fixes cause type errors.

## Validation
- `pnpm check` passes (strict TypeScript compilation)
- Zero occurrences of `any` type in src/ (excluding node_modules and generated files)
- All exported functions have explicit return type annotations

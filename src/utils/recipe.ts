import { cn } from './cn';

/* eslint-disable @typescript-eslint/no-explicit-any */

type VariantValue = string | boolean | undefined | null;
type VariantMap = Record<string, Record<string, string>>;
type CompoundVariant = {
  class: string;
  [variantKey: string]: VariantValue | string;
};

export type RecipeConfig = {
  /** Classes always applied, per slot. */
  base?: Record<string, string>;
  /** variantName -> variantValue -> classes (single slot) or slot->classes (multi) */
  variants?: Record<string, VariantMap>;
  /** Independent boolean flags, applied alongside `variants`. */
  booleans?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, VariantValue>;
  compoundVariants?: CompoundVariant[];
};

export type RecipeProps = Record<string, VariantValue> & { className?: string };

/**
 * A tiny slot-aware variant recipe — the library's own replacement for
 * `tailwind-variants` / `class-variance-authority`.
 *
 * Why not a dependency: the library's whole surface is these recipes, so a
 * ~3KB runtime dep would be paid by every consumer for ~60 lines of logic we
 * already understand. This version differs from CVA in two ways that matter
 * here:
 *
 * 1. **Slots.** A multi-part component (Toast: root/title/description/close)
 *    declares classes per slot in ONE recipe, so slot class lists stay next to
 *    each other and cannot drift, instead of one CVA call per slot.
 * 2. **`cn` with token-aware merging.** Output goes through the library's `cn`,
 *    which understands the `a2z` class groups, so a consumer's `className`
 *    reliably beats a variant default.
 */
export function createRecipe<C extends RecipeConfig>(config: C) {
  const slotNames = Object.keys(config.base ?? {});

  return function resolve(props: RecipeProps = {}): Record<string, string> {
    const out: Record<string, string> = {};

    for (const slot of slotNames) out[slot] = config.base?.[slot] ?? '';

    const pick = (variantName: string, value: VariantValue) => {
      const group = config.variants?.[variantName];
      if (!group) return;
      const key = value === undefined || value === null ? '' : String(value);
      const chosen = group[key];
      if (!chosen) return;

      if (slotNames.length <= 1) {
        const slot = slotNames[0] ?? 'root';
        out[slot] = cn(out[slot], chosen);
        return;
      }

      // Multi-slot: `variants.size.md` is either `{ root, label }` (per-slot) or
      // a flat class string applied to the root slot.
      if (typeof chosen === 'string') {
        out.root = cn(out.root, chosen);
        return;
      }
      for (const [slot, cls] of Object.entries(chosen as unknown as Record<string, string>)) {
        if (!(slot in out)) out[slot] = '';
        out[slot] = cn(out[slot], cls);
      }
    };

    const merged: Record<string, VariantValue> = { ...config.defaultVariants };
    for (const key of Object.keys(config.variants ?? {})) {
      if (props[key] !== undefined) merged[key] = props[key];
    }
    for (const key of Object.keys(merged)) pick(key, merged[key]);

    for (const flag of Object.keys(config.booleans ?? {})) {
      if (props[flag]) {
        const cls = config.booleans?.[flag]?.true;
        if (cls) out.root = cn(out.root, cls);
      }
    }

    for (const compound of config.compoundVariants ?? []) {
      const { class: cls, ...conditions } = compound;
      const matches = Object.entries(conditions).every(([key, want]) => {
        const got = props[key] !== undefined ? props[key] : config.defaultVariants?.[key];
        return got === want;
      });
      if (matches) out.root = cn(out.root, cls);
    }

    if (props.className) out.root = cn(out.root, props.className);

    return out;
  };
}

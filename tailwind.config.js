/**
 * Registers the design tokens from `assets/app.css` with Tailwind.
 *
 * Without this every brand colour has to be written as an arbitrary value —
 * `text-[hsl(var(--muted-foreground))]` — which cannot be autocompleted or
 * linted, and is longer to type than `text-emerald-500`. That asymmetry is why
 * pages drifted onto raw Tailwind defaults. With this file the brand palette is
 * the path of least resistance: `text-muted-foreground`, `bg-primary`.
 *
 * Colours stay as bare HSL channels in the CSS so `/<alpha-value>` keeps
 * working — `bg-primary/15` still resolves correctly.
 */

/** Wraps a token so Tailwind can apply its own opacity modifier to it. */
const token = variable => `hsl(var(--${variable}) / <alpha-value>)`

export default {
  theme: {
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground')
        },
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground')
        },
        secondary: {
          DEFAULT: token('secondary'),
          foreground: token('secondary-foreground')
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground')
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground')
        },
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        purple: token('purple'),
        gold: token('gold'),
        golden: {
          50: token('golden-50'),
          100: token('golden-100'),
          200: token('golden-200'),
          300: token('golden-300'),
          500: token('golden-500'),
          600: token('golden-600'),
          /** The only gold that passes AA as body text — 6.01:1 on white. */
          900: token('golden-900')
        }
      },
      borderRadius: {
        DEFAULT: 'var(--radius)'
      },
      fontFamily: {
        sans: ['DM Sans', 'Segoe UI', 'sans-serif'],
        display: ['Cinzel', 'serif']
      },
      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)'
      }
    }
  }
}

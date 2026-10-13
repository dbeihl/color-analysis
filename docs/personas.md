# Personas

## David Beihl (owner, primary user)

Built the tool and uses it on himself. Picks the closest published skin, hair and eye references and reads back the nearest of twelve palette recipes.

- Goal: a palette starting point he can test against his own face, with the score separation shown honestly.
- Task: choose references he recognises as a close match, ask for the suggestion, and read the nearest recipe and its palette in comparison order.

Journey: `e2e/david.spec.ts`.

## Suzanne Rio Mosqueda (David's fiancée)

Uses the tool alongside David. The references may not describe her well in every light, so she relies on the match-quality question to keep the result honest.

- Goal: a suggestion that says plainly when it is not reliable.
- Task: choose her closest references, say none matched reliably, and see the result flagged as not a reliable answer, with the palette still shown as a starting point.

Journey: `e2e/suzanne.spec.ts`.

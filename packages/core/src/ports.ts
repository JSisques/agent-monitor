import type { SessionSnapshot } from "./model.ts"

/**
 * Driven port: whatever hosts the sessions (OpenCode today) implements it.
 * The adapter translates host data into `SessionSnapshot`s and reports changes;
 * it never aggregates.
 */
export interface SessionSource {
  /** Every session in the root session's family, root included. */
  snapshot(rootId: string): readonly SessionSnapshot[]
  /** Calls `listener` whenever any session data may have changed. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void
}

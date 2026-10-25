export type ScrollWorldConfig = Record<string, unknown>;
export type ScrollWorldInstance = {
  dispose(): void;
  /** Settles once the opening poster has decoded (absent when there are no sections). */
  firstPainted?: Promise<void>;
  /** Flies to the end of the flight (the hand-off); false when there was nothing to fly. Absent when there are no sections. */
  flyToEnd?(): boolean;
};
export function mountScrollWorld(container: HTMLElement, config: ScrollWorldConfig): ScrollWorldInstance;

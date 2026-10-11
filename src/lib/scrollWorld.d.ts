export type ScrollWorldConfig = Record<string, unknown>;
export type ScrollWorldInstance = {
  dispose(): void;
  /** Settles once the opening poster has decoded (absent when there are no sections). */
  firstPainted?: Promise<void>;
};
export function mountScrollWorld(container: HTMLElement, config: ScrollWorldConfig): ScrollWorldInstance;

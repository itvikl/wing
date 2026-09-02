export type ScrollWorldConfig = Record<string, unknown>;
export type ScrollWorldInstance = { dispose(): void };
export function mountScrollWorld(container: HTMLElement, config: ScrollWorldConfig): ScrollWorldInstance;

// Shared by the accessibility menu (client) and the layout's boot script
// (server). Kept out of the 'use client' module: a server component importing
// a constant from one gets a client reference, not the value.

export type A11yToggle = 'contrast' | 'mono' | 'links' | 'font' | 'still' | 'cursor';

export const A11Y_STORAGE_KEY = 'wings_a11y';
export const A11Y_TOGGLES: A11yToggle[] = ['contrast', 'mono', 'links', 'font', 'still', 'cursor'];
/** Root font size per text-size step, as in globals.css's .a11y-text-N. */
export const A11Y_TEXT_STEPS = [100, 112, 125, 140];

/** Inline in <head>: applies the visitor's saved settings before the first paint. */
export const A11Y_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('${A11Y_STORAGE_KEY}')||'{}'),c=document.documentElement.classList;if(s.text)c.add('a11y-text-'+s.text);${JSON.stringify(A11Y_TOGGLES)}.forEach(function(k){if(s[k])c.add('a11y-'+k)})}catch(e){}})();`;

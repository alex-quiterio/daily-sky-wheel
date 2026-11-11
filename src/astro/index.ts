// The calculation layer: everything the page knows about the sky, with no DOM in it.
// One namespace per tradition, plus Core (positions and houses), which the others build on.
export * as Core from './core.ts';
export * as Western from './western.ts';
export * as WesternReading from './western-reading.ts';
export * as Chinese from './chinese.ts';
export * as ChineseReading from './chinese-reading.ts';
export * as Vedic from './vedic.ts';
export * as VedicReading from './vedic-reading.ts';
export * as Glossary from './glossary.ts';
export * as Maya from './maya.ts';
export * as MayaReading from './maya-reading.ts';
export * as Hebrew from './hebrew.ts';
export * as Islamic from './islamic.ts';
// the shapes used across the page are also exported by name: Chart, Aspect, Reading, ...
export type * from './core.ts';
export type * from './western.ts';
export type * from './reading.ts';
export type * from './glossary.ts';

// The shape both readings produce, and the reading card draws.

// A reading: a summary, advice, then sections of lines. `ref` names the part of the chart a line is about,
// `more` is a second layer of [label, value] rows behind it.
export interface ReadingItem {
  id?: string;
  head: string;
  text: string;
  ref?: string;
  more?: [string, string][];
}
export interface ReadingSection {
  title: string;
  items: ReadingItem[];
}
export interface Reading {
  summary: string;
  advice: { good: string[]; care: string[] };
  sections: ReadingSection[];
  text: string; // the whole reading as plain text
}

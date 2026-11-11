// The slow calculations, written as jobs so they can run off the main thread.
// A job takes and returns plain data (numbers, strings, Dates), because that is all that crosses to a worker.
// Nothing here may touch the DOM: this file is bundled into the worker as well as the page.
import { Vedic, Western } from '#astro';

export const JOBS = {
  // a year of eclipses, stations, ingresses and outer-planet aspects from `start`
  yearAhead: (start: number) => Western.yearAhead(new Date(start)),
  // festivals and observances for `days` days from local midnight `start` at a place
  vedicDaysAhead: (start: number, days: number, lat: number, lon: number) =>
    Vedic.daysAhead(new Date(start), days, lat, lon),
};

export type Jobs = typeof JOBS;
export type JobName = keyof Jobs;

// what the page sends the worker, and what comes back
export interface JobRequest {
  id: number;
  job: JobName;
  args: unknown[];
}
export interface JobReply {
  id: number;
  result?: unknown;
  error?: string;
}

// run a job by name, wherever this code is running
export function runJob(job: JobName, args: unknown[]): unknown {
  return (JOBS[job] as (...args: unknown[]) => unknown)(...args);
}

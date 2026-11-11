// Runs a slow calculation in a Web Worker, so the page stays responsive while it works.
// If the worker cannot start, or fails, the job runs on the main thread instead: slower to respond, same answer.
import { runJob } from '#lib/jobs.ts';
import type { JobName, JobReply, JobRequest, Jobs } from '#lib/jobs.ts';

// The worker bundle sits next to the page bundle and carries the same version stamp.
// This has to be read while the page's script is first running, which is when this module loads.
const page = document.currentScript instanceof HTMLScriptElement ? document.currentScript.src : '';
const workerURL = /app\.js/.test(page) ? page.replace('app.js', 'worker.js') : '';

interface Waiting {
  resolve: (result: unknown) => void;
  reject: (reason: Error) => void;
}
const waiting = new Map<number, Waiting>();
let worker: Worker | null | undefined; // undefined: not started yet · null: not available
let nextId = 1;

function start(): Worker | null {
  if (!workerURL || typeof Worker === 'undefined') return null;
  try {
    const w = new Worker(workerURL);
    w.addEventListener('message', (e: MessageEvent<JobReply>) => {
      const job = waiting.get(e.data.id);
      if (!job) return;
      waiting.delete(e.data.id);
      if (e.data.error) job.reject(new Error(e.data.error));
      else job.resolve(e.data.result);
    });
    // the worker script failed to load or crashed: hand every waiting job back, and stop using it
    w.addEventListener('error', () => {
      worker = null;
      waiting.forEach((job) => job.reject(new Error('the worker failed')));
      waiting.clear();
    });
    return w;
  } catch (e) {
    return null;
  }
}

// on the main thread, after the current paint
const onMainThread = (job: JobName, args: unknown[]) =>
  new Promise<unknown>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(runJob(job, args));
      } catch (e) {
        reject(e);
      }
    }, 0);
  });

export function background<N extends JobName>(job: N, ...args: Parameters<Jobs[N]>): Promise<ReturnType<Jobs[N]>> {
  if (worker === undefined) worker = start();
  const w = worker;
  const run = w
    ? new Promise<unknown>((resolve, reject) => {
        const request: JobRequest = { id: nextId++, job, args };
        waiting.set(request.id, { resolve, reject });
        w.postMessage(request);
      }).catch(() => onMainThread(job, args))
    : onMainThread(job, args);
  return run as Promise<ReturnType<Jobs[N]>>;
}

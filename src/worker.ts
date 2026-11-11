// The worker: runs the slow calculations away from the page. It knows only #lib/jobs.ts and, through it, #astro.
import { runJob } from '#lib/jobs.ts';
import type { JobReply, JobRequest } from '#lib/jobs.ts';

addEventListener('message', (e: MessageEvent<JobRequest>) => {
  const { id, job, args } = e.data;
  let reply: JobReply;
  try {
    reply = { id, result: runJob(job, args) };
  } catch (err) {
    reply = { id, error: String(err) };
  }
  postMessage(reply);
});

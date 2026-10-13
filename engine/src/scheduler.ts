// One frame loop for everything (system.md §7.3). It runs only while something asked for a frame,
// and each frame runs every job's read step, then every evaluate step, then every write step, so
// the browser never lays out twice. When nothing is dirty, no requestAnimationFrame is pending.

export interface Job {
  read?(t: number): void
  evaluate?(t: number, dt: number): void
  write?(t: number, dt: number): void
  onError?(err: unknown): void
}

export interface SchedulerStats {
  frames: number // frames run since creation
  pending: boolean // a frame is requested
  lastMs: number // duration of the last frame's work
}

export class Scheduler {
  private queued = new Set<Job>()
  private raf = 0
  private timer = 0
  private last = 0
  private stats: SchedulerStats = { frames: 0, pending: false, lastMs: 0 }

  // Ask for `job` to run in the next frame. Repeated requests before then coalesce.
  // Hidden pages never fire requestAnimationFrame, so there a timer stands in: layout and state
  // still settle in a background tab (animations stop on their own, since boxes aren't visible).
  request(job: Job): void {
    this.queued.add(job)
    if (this.raf || this.timer) return
    this.stats.pending = true
    if (document.hidden) {
      this.timer = window.setTimeout(() => {
        this.timer = 0
        this.run(performance.now())
      }, 0)
    } else {
      this.raf = requestAnimationFrame((t) => {
        this.raf = 0
        this.run(t)
      })
    }
  }

  cancel(job: Job): void {
    this.queued.delete(job)
    if (this.queued.size === 0) this.clearPending()
  }

  // Run queued jobs now, synchronously (for view transitions, which snapshot after a callback).
  flush(): void {
    this.clearPending()
    this.run(performance.now())
  }

  private clearPending() {
    if (this.raf) cancelAnimationFrame(this.raf)
    if (this.timer) clearTimeout(this.timer)
    this.raf = 0
    this.timer = 0
    this.stats.pending = false
  }

  // A frame requested just before the page was hidden would wait until it is shown again.
  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden || !this.raf) return
      cancelAnimationFrame(this.raf)
      this.raf = 0
      this.timer = window.setTimeout(() => {
        this.timer = 0
        this.run(performance.now())
      }, 0)
    })
  }

  snapshot(): SchedulerStats {
    return { ...this.stats }
  }

  private run(t: number): void {
    const jobs = [...this.queued]
    this.queued.clear()
    this.stats.pending = false
    if (jobs.length === 0) return
    const start = performance.now()
    const dt = this.last ? Math.min(t - this.last, 100) : 16.7
    this.last = t
    const step = (fn: (job: Job) => void) => {
      for (const job of jobs) {
        try {
          fn(job)
        } catch (err) {
          if (job.onError) job.onError(err)
          else console.error('Eloi: a frame job failed', err)
        }
      }
    }
    step((j) => j.read?.(t))
    step((j) => j.evaluate?.(t, dt))
    step((j) => j.write?.(t, dt))
    this.stats.frames++
    this.stats.lastMs = performance.now() - start
    // Jobs that asked again during this frame run next frame; reset the clock when idle so the
    // first dt after a pause isn't the whole pause.
    if (this.queued.size === 0) this.last = 0
  }
}

// The default scheduler shared by every frame on the page, unless a host passes its own.
export const defaultScheduler = new Scheduler()

// Remote photoplethysmography (rPPG): estimate heart rate from tiny
// colour changes in the skin captured by the webcam. We average the green
// channel of a forehead ROI over time and find the dominant beat frequency
// by autocorrelation. PoC-grade — noisy, needs steady light and a still face.

const MIN_BPM = 45;
const MAX_BPM = 170;
const WINDOW_MS = 12_000; // analysis window
const MIN_SPAN_MS = 6_000; // need this much history before a first estimate
const MIN_SAMPLES = 64;

type Sample = { t: number; v: number };

export class PpgEstimator {
  private buf: Sample[] = [];
  private ema: number | null = null;

  push(green: number, t = performance.now()) {
    this.buf.push({ t, v: green });
    const cutoff = t - WINDOW_MS;
    while (this.buf.length && this.buf[0].t < cutoff) this.buf.shift();
  }

  reset() {
    this.buf = [];
    this.ema = null;
  }

  /** @returns { bpm, quality 0..1 } or null when not enough/too weak signal */
  estimate(): { bpm: number; quality: number } | null {
    const n = this.buf.length;
    if (n < MIN_SAMPLES) return null;
    const span = this.buf[n - 1].t - this.buf[0].t;
    if (span < MIN_SPAN_MS) return null;

    const fps = (n - 1) / (span / 1000);
    const x = this.buf.map((s) => s.v);

    // detrend: subtract a moving average (~1 s) -> crude high-pass
    const win = Math.max(3, Math.round(fps));
    const d = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let c = 0;
      for (let j = i - win; j <= i + win; j++) {
        if (j >= 0 && j < n) {
          sum += x[j];
          c++;
        }
      }
      d[i] = x[i] - sum / c;
    }

    // normalize
    const mean = d.reduce((a, b) => a + b, 0) / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) {
      d[i] -= mean;
      varSum += d[i] * d[i];
    }
    if (varSum < 1e-6) return null;

    // autocorrelation over physiologically plausible lags
    const minLag = Math.floor((60 / MAX_BPM) * fps);
    const maxLag = Math.ceil((60 / MIN_BPM) * fps);
    let bestLag = -1;
    let bestCorr = 0;
    for (let lag = minLag; lag <= maxLag && lag < n; lag++) {
      let s = 0;
      for (let i = 0; i + lag < n; i++) s += d[i] * d[i + lag];
      const corr = s / varSum;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
    if (bestLag < 0 || bestCorr < 0.3) return null;

    const bpm = (60 * fps) / bestLag;
    if (bpm < MIN_BPM || bpm > MAX_BPM) return null;

    // smooth across calls so the readout doesn't jump
    this.ema = this.ema == null ? bpm : this.ema * 0.8 + bpm * 0.2;
    return {
      bpm: Math.round(this.ema),
      quality: Math.max(0, Math.min(1, bestCorr)),
    };
  }
}

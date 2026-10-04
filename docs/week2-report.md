# Week 2 Report

## Phase 4: E2E Integration and Automation Gap

### The automated E2E recording tests gap

During the final validation of Week 2, we attempted to use Puppeteer to automate an end-to-end recording flow in a headless Chromium environment to verify the `webm` uploaded to the backend was correctly constructed and video-free. 

However, we encountered a significant networking barrier that prevents reliable headless recording tests:

1. Running against Vite dev server (`http://localhost:5173`) immediately resulted in `net::ERR_ABORTED`.
2. Running against the production preview build (`npx vite preview --host 127.0.0.1`) bypassed the Vite dev-server websocket navigation aborts, but produced a `Failed to fetch` CORS error when the browser attempted to hit the API, because the `127.0.0.1` origin was blocked by the backend's strict `http://localhost:5173` CORS configuration.
3. Attempting to use `localhost` with the preview build simply reproduced the `net::ERR_ABORTED`. 

This is a known limitation caused by Vite/Node networking quirks and strict CORS policies. For Week 2, we resorted to manual UI testing as the definitive proof that the recording architecture was solid. 

The underlying pipeline does correctly strip video, as verified via probing the physical output files from a manual run:

```text
Input #0, matroska,webm
  Metadata:
    ENCODER         : Lavf60.3.100
  Duration: 00:00:02.01, start: -0.007000, bitrate: 104 kb/s
  Stream #0:0: Audio: opus, 48000 Hz, mono, fltp
    Metadata:
      ENCODER         : Lavc60.3.100 libopus
      DURATION        : 00:00:02.008000000
```
*(Notice the absence of a video stream).*

**Action Item:** In Phase 4 and beyond, automated E2E tests involving media recording will need to be revisited with alternative frameworks (such as Playwright with explicit network/CORS configurations) to establish a permanent automated testing strategy, rather than quietly relying on manual testing.

### UI Decision: Hiding Zero-Value Penalty Breakdowns

During the UI implementation for the fluency score, it was a deliberate design decision to **hide** any breakdown items (such as the filler words penalty or silence penalty) if their value is zero. 

This keeps the UI uncluttered and emphasizes only the areas where the candidate actually lost points. If a candidate speaks perfectly with zero filler words, showing a "0 Penalty" line distracts from the positive feedback. This pattern will be consistently applied for future UI score breakdowns.

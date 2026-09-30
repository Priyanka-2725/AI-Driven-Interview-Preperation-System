import express from 'express';
const app = express();
app.post('/api/v1/evaluate', (req, res) => {
  res.json({
    fluency: { score: 80, wpm: 120 },
    confidence: { isSample: true, score: 70 },
    transcript: { fullText: "test" }
  });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(8000, () => console.log('Mock ML server on 8000'));

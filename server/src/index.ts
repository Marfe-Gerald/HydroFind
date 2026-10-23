import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import ordersRouter from './routes/orders';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log(`API on :${port}`));

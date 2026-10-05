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

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log(`API on :${port}`));

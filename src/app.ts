import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import * as middlewares from './middlewares';
import errorHandler from './middlewares/errorHandler';
import routes from './routes';
import { secureEnvParse } from './utils/secureEnvParse';

const encPath = path.resolve(__dirname, '../../config/.env.enc');
const keyPath = path.resolve(__dirname, '../../config/.env.key');

if (fs.existsSync(encPath) && fs.existsSync(keyPath)) {
  secureEnvParse(encPath, keyPath);
} else {
  console.warn('Encrypted env not found, loading .env instead.');
  dotenv.config();
}

const app = express();

app.use(express.json());

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Attraction API' });
});

app.use(middlewares.beforeRoutesMiddleware.validateRoute);
app.use(middlewares.beforeRoutesMiddleware.validateMethod);

app.use(errorHandler.errorLogger);

export default app;
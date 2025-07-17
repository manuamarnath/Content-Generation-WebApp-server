import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import contentRoutes from './routes/content.js';
import usersRoutes from './routes/users.js';

const app = express();

// Configure CORS to allow requests from your Vercel frontend
const corsOptions = {
  origin: [
    'https://echo5digital-content-generator.vercel.app',
    'http://localhost:5173', // Local development
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5050;

app.get('/', (req, res) => {
  res.send('Echo5Digital-Content-Generator API running');
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', usersRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));

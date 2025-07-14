// routes/seedSuperAdmin.js
import express from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';  // adjust path if needed

const router = express.Router();

router.post('/seed-superadmin', async (req, res) => {
  const { secret } = req.body;
  if (secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ email: 'admin@test.com' });
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hash = await bcrypt.hash('admin', 10);
    await User.create({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: hash,
      role: 'superadmin',
      approved: true
    });

    return res.status(201).json({ message: 'Super Admin created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error', error: err.message });
  }
});

export default router;

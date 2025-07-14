import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

async function createSuperAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash('admin', 10);
  await User.create({
    name: 'Super Admin',
    email: 'admin@test.com',
    password: hash,
    role: 'superadmin',
    approved: true
  });
  console.log('Super Admin created');
  process.exit(0);
}

createSuperAdmin();

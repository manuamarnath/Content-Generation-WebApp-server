import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'user'], default: 'user' },
  approved: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false }, // Added blocked field
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);

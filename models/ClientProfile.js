import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  website: { type: String, required: true },
  prompt: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date }
});

export default mongoose.model('ClientProfile', clientProfileSchema);

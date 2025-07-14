import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientProfile' },
  title: String,
  keywords: [String],
  length: Number,
  type: { type: String, enum: ['blog', 'website'] },
  headings: Number,
  generatedContent: String,
  createdAt: { type: Date, default: Date.now },
  generations: { type: Number, default: 1 },
  regenerations: { type: Number, default: 0 },
});

export default mongoose.model('Content', contentSchema);

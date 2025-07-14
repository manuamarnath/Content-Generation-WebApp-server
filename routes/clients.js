import express from 'express';
import ClientProfile from '../models/ClientProfile.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to check JWT
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Create client profile
router.post('/', auth, async (req, res) => {
  try {
    const { name, website, prompt } = req.body;
    const profile = new ClientProfile({
      name,
      website,
      prompt,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedBy: req.user.id,
      updatedAt: new Date()
    });
    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all client profiles
router.get('/', auth, async (req, res) => {
  try {
    const profiles = await ClientProfile.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update client profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, website, prompt } = req.body;
    const updated = await ClientProfile.findByIdAndUpdate(
      req.params.id,
      {
        name,
        website,
        prompt,
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Client not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client profile
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await ClientProfile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

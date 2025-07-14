import express from 'express';
import OpenAI from 'openai';
import Content from '../models/Content.js';
import ClientProfile from '../models/ClientProfile.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

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

// Generate content
router.post('/generate', auth, async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { clientId, title, keywords, length, type, headings } = req.body;
    const client = await ClientProfile.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const prompt = `Client: ${client.name}\nWebsite: ${client.website}\nNature: ${client.prompt}\nTitle: ${title}\nKeywords: ${keywords.join(', ')}\nLength: ${length} words\nType: ${type}\nHeadings: ${headings}\nGenerate unique SEO content.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9
    });
    const generatedContent = completion.choices[0].message.content;
    res.json({ generatedContent });
  } catch (err) {
    res.status(500).json({ message: 'OpenAI error', error: err.message });
  }
});

// Save generated content
router.post('/save', auth, async (req, res) => {
  try {
    const { clientId, title, keywords, length, type, headings, generatedContent } = req.body;
    const content = new Content({
      user: req.user.id,
      client: clientId,
      title,
      keywords,
      length,
      type,
      headings,
      generatedContent,
      generations: 1,
    });
    await content.save();
    res.status(201).json(content);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Regenerate content
router.post('/regenerate', auth, async (req, res) => {
  try {
    const { contentId } = req.body;
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ message: 'Content not found' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const client = await ClientProfile.findById(content.client);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const prompt = `Client: ${client.name}\nWebsite: ${client.website}\nNature: ${client.prompt}\nTitle: ${content.title}\nKeywords: ${content.keywords.join(', ')}\nLength: ${content.length} words\nType: ${content.type}\nHeadings: ${content.headings}\nGenerate unique SEO content.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9
    });
    const generatedContent = completion.choices[0].message.content;

    content.generatedContent = generatedContent;
    content.regenerations += 1;
    await content.save();

    res.json({ generatedContent });
  } catch (err) {
    res.status(500).json({ message: 'OpenAI error', error: err.message });
  }
});

// Track usage (generation or regeneration)
router.post('/track-usage', auth, async (req, res) => {
  try {
    const { type } = req.body; // type: 'generation' or 'regeneration'
    if (!['generation', 'regeneration'].includes(type)) {
      return res.status(400).json({ message: 'Invalid usage type' });
    }
    // Create a minimal usage record for this user and month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let usageDoc = await Content.findOne({
      user: req.user.id,
      createdAt: { $gte: startOfMonth }
    });
    if (!usageDoc) {
      usageDoc = new Content({
        user: req.user.id,
        client: null,
        title: '',
        keywords: [],
        length: 0,
        type: 'blog',
        headings: 0,
        generatedContent: '',
        generations: 0,
        regenerations: 0,
      });
    }
    if (type === 'generation') usageDoc.generations += 1;
    if (type === 'regeneration') usageDoc.regenerations += 1;
    await usageDoc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get generation logs (Super Admin only)
router.get('/logs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const logs = await Content.find().populate('user client');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get usage stats (Super Admin only)
router.get('/usage', auth, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
  try {
    if (req.query.by === 'day') {
      // Daily usage for the current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const usage = await Content.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: { day: { $dayOfMonth: '$createdAt' } },
          generations: { $sum: '$generations' },
          regenerations: { $sum: '$regenerations' },
        }},
        { $project: {
          _id: 0,
          date: { $concat: [
            { $toString: now.getFullYear() }, '-',
            { $cond: [ { $lt: [now.getMonth() + 1, 10] }, { $concat: ['0', { $toString: now.getMonth() + 1 }] }, { $toString: now.getMonth() + 1 } ] }, '-',
            { $cond: [ { $lt: ['$_id.day', 10] }, { $concat: ['0', { $toString: '$_id.day' }] }, { $toString: '$_id.day' } ] }
          ] },
          generations: 1,
          regenerations: 1,
        }},
        { $sort: { date: 1 } },
      ]);
      return res.json(usage);
    }

    const usage = await Content.aggregate([
      {
        $group: {
          _id: {
            user: '$user',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          totalGenerations: { $sum: '$generations' },
          totalRegenerations: { $sum: '$regenerations' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: '$userDetails',
      },
      {
        $project: {
          _id: 0,
          user: '$userDetails.name',
          email: '$userDetails.email',
          month: '$_id.month',
          year: '$_id.year',
          totalGenerations: 1,
          totalRegenerations: 1,
        },
      },
      {
        $sort: {
          year: -1,
          month: -1,
          user: 1,
        },
      },
    ]);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;

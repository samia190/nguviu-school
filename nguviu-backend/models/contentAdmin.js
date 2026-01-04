const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

// Middleware for admin auth (if any), add here or ensure it's applied globally

// Get all content items
router.get('/', async (req, res) => {
  try {
    const contents = await Content.find({});
    res.json(contents);
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ error: 'Server error fetching content' });
  }
});

// Get content by ID
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    console.error('Error fetching content by ID:', err);
    res.status(500).json({ error: 'Server error fetching content' });
  }
});

// Create new content
router.post('/', async (req, res) => {
  try {
    const newContent = new Content(req.body);
    await newContent.save();
    res.status(201).json(newContent);
  } catch (err) {
    console.error('Error creating content:', err);
    res.status(400).json({ error: 'Invalid content data' });
  }
});

// Update content by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(updatedContent);
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(400).json({ error: 'Invalid content data' });
  }
});

// Delete content by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);
    if (!deletedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ message: 'Content deleted successfully' });
  } catch (err) {
    console.error('Error deleting content:', err);
    res.status(500).json({ error: 'Server error deleting content' });
  }
});

module.exports = router;

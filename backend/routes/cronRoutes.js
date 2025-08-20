const express = require('express');
const router = express.Router();

// This is the new endpoint for your cron job
router.get('/cleanup', (req, res) => {
  console.log('Cron job for cleanup executed!');
  // **Place your task-specific code here**
  // For example:
  // db.collection('old_data').deleteMany({ date: { $lt: new Date('2025-01-01') } });

  res.status(200).json({ message: 'Task completed successfully' });
});

module.exports = router;
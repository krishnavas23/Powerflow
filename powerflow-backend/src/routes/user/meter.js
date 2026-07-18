const express = require('express');
const router = express.Router();
const MeterReading = require('../../models/MeterReading');

const meterController = require('../../controllers/user/meterController');

// POST: Add or simulate reading
router.post('/add', meterController.addReading);

// GET: Fetch latest readings for a meter
router.get('/:meterId', meterController.getReadings);

// GET: Fetch daily stats (for admin dashboard)
router.get('/:meterId/daily', meterController.getDailyStats);

// Fetch latest meter readings (limit 20 for now)
router.get('/', async (req, res) => {
  try {
    const readings = await MeterReading.find().sort({ timestamp: -1 }).limit(20);
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Get readings for a specific meter
router.get('/:meterId', async (req, res) => {
  try {
    const readings = await MeterReading.find({ meterId: req.params.meterId })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(readings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching meter data' });
  }
});


module.exports = router;

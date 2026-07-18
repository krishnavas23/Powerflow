const MeterReading = require('../../models/MeterReading');

// Create / simulate new reading
exports.addReading = async (req, res) => {
  try {
    const { meterId, voltage, current, powerFactor, activePowerKW, cumulativeKWh, status } = req.body;
    if (!meterId) return res.status(400).json({ error: 'meterId is required' });

    const reading = await MeterReading.create({
      meterId,
      voltage,
      current,
      powerFactor,
      activePowerKW,
      cumulativeKWh,
      status
    });

    res.status(201).json({ message: 'Reading added', reading });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch latest readings
exports.getReadings = async (req, res) => {
  try {
    const { meterId } = req.params;
    const { limit = 100 } = req.query;

    const readings = await MeterReading.find({ meterId })
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({ meterId, count: readings.length, readings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Aggregate energy usage by day
exports.getDailyStats = async (req, res) => {
  try {
    const { meterId } = req.params;

    const data = await MeterReading.aggregate([
      { $match: { meterId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          totalKWh: { $max: "$cumulativeKWh" },
          avgPower: { $avg: "$activePowerKW" },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ meterId, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

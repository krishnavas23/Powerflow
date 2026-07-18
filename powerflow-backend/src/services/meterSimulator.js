const MeterReading = require('../models/MeterReading');
const User = require('../models/User');

// Generate pseudo-realistic random readings
function generateReading(baseKWh) {
  const voltage = 220 + Math.random() * 10;           // 220-230 V
  const current = 5 + Math.random() * 10;             // 5-15 A
  const powerFactor = 0.8 + Math.random() * 0.2;      // 0.8-1.0
  const activePowerKW = (voltage * current * powerFactor) / 1000;
  const cumulativeKWh = baseKWh + activePowerKW * 0.0167; // ~1 min interval

  return { voltage, current, powerFactor, activePowerKW, cumulativeKWh };
}

// Run simulation for all users once every minute
async function runSimulation() {
  try {
    const users = await User.find({}, 'meterId');
    for (const user of users) {
      const lastReading = await MeterReading.findOne({ meterId: user.meterId }).sort({ timestamp: -1 });
      const baseKWh = lastReading ? lastReading.cumulativeKWh : Math.random() * 100;

      const data = generateReading(baseKWh);

      await MeterReading.create({
        meterId: user.meterId,
        ...data,
        status: 'OK',
      });
    }

    console.log(`✅ Meter simulation tick completed for ${users.length} users`);
  } catch (err) {
    console.error('⚠️ Meter simulation error:', err.message);
  }
}

// Start periodic simulation (every 60 s)
function startMeterSimulation() {
  console.log('⚡ Virtual smart-meter simulation started');
  runSimulation(); // first run immediately
  setInterval(runSimulation, 60 * 1000);
}

module.exports = { startMeterSimulation };

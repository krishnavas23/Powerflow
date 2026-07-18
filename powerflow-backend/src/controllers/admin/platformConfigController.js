const PlatformConfig = require('../../models/PlatformConfig');

// ✅ Fetch existing configuration
exports.getPlatformConfig = async (req, res) => {
  try {
    let config = await PlatformConfig.findOne();
    if (!config) {
      config = await PlatformConfig.create({});
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching platform config:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Update configuration
exports.updatePlatformConfig = async (req, res) => {
  try {
    let config = await PlatformConfig.findOne();
    if (!config) config = new PlatformConfig();

    const updates = req.body;
    Object.assign(config, updates);

    await config.save();
    res.json({ message: 'Configuration updated successfully', config });
  } catch (error) {
    console.error('Error updating platform config:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

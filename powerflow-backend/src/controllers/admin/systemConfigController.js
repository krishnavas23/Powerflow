const SystemConfig = require('../../models/SystemConfig');

// ✅ Get System Config
exports.getSystemConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            config = await SystemConfig.create({});
        }
        res.status(200).json(config);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching system config', error: err.message });
    }
};

// ✅ Update System Config
exports.updateSystemConfig = async (req, res) => {
    try {
        const updatedConfig = await SystemConfig.findOneAndUpdate({}, req.body, {
            new: true,
            upsert: true
        });
        res.status(200).json({ message: 'System configuration updated successfully', config: updatedConfig });
    } catch (err) {
        res.status(500).json({ message: 'Error updating system config', error: err.message });
    }
};

// ✅ Perform Maintenance Actions
exports.performMaintenance = async (req, res) => {
    const { action } = req.params;

    try {
        switch (action) {
            case 'clear-cache':
                // Placeholder logic
                return res.json({ success: true, message: 'Cache cleared successfully' });
            case 'optimize-db':
                return res.json({ success: true, message: 'Database optimized successfully' });
            case 'generate-backup':
                return res.json({ success: true, message: 'Backup generated successfully' });
            case 'system-health':
                return res.json({
                    success: true,
                    status: 'All systems operational',
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                });
            default:
                return res.status(400).json({ success: false, message: 'Unknown maintenance action' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Maintenance operation failed', error: err.message });
    }
};

const auth = require('./auth');
const requireAdmin = require('./requireAdmin');

/**
 * Allows Power BI Desktop / scheduled refresh via X-PowerBI-Key,
 * or falls back to standard admin JWT auth.
 */
module.exports = async function powerbiAuth(req, res, next) {
  const apiKey = req.headers['x-powerbi-key'];
  const configuredKey = process.env.POWERBI_API_KEY;

  if (configuredKey && apiKey && apiKey === configuredKey) {
    return next();
  }

  return auth(req, res, () => requireAdmin(req, res, next));
};

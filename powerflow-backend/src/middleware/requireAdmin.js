
module.exports = (req, res, next) => {
  const role = req.user?.role;
  if (role && String(role).toLowerCase() === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Admins only' });
};

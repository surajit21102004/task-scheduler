/**
 * Middleware to check if authenticated employee has required permission
 */
export const requirePermission = (...permissionKeys) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Admin has all permissions implicitly
    if (req.user.role === 'admin') {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasAny = permissionKeys.some((key) => userPerms.includes(key));

    if (hasAny) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied. Required permission: '${permissionKeys.join(' or ')}'`,
    });
  };
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

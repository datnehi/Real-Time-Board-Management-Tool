const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token không tồn tại' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Thay JWT_SECRET bằng secret key của bạn
    req.user = { id: decoded.userId }; // Giả sử payload token có trường userId
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' });
  }
};

module.exports = authMiddleware;

const { User } = require('../models/User');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // 클라이언트 쿠키에서 토큰 가져오기
    const token = req.cookies.x_auth;

    if (!token) {
      return res.status(400).json({ success: false, message: '토큰이 없습니다.' });
    }

    // 토큰 검증 및 유저 찾기
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded, token });

    if (!user) {
      return res.status(401).json({ isAuth: false, message: '유효하지 않은 토큰입니다.' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: '인증 실패' });
  }
};

module.exports = { auth };

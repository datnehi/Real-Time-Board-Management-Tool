const { db } = require('../firebase/firebase');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const axios = require('axios');

const { v4: uuidv4 } = require('uuid');

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Kiểm tra xem user đã tồn tại chưa
  const snapshot = await db.collection('users').where('email', '==', email).get();
  let userRef;

  if (snapshot.empty) {
    // Tạo user mới với uuid
    const userId = uuidv4();
    userRef = db.collection('users').doc(userId);
    await userRef.set({
      userId,
      email,
      verificationCode: code,
      verified: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    // Cập nhật mã code mới
    userRef = snapshot.docs[0].ref;
    await userRef.update({
      verificationCode: code,
      createdAt: new Date().toISOString(),
    });
  }

  await sendEmail(email, 'Your Verification Code', `Your code is: ${code}`);
  res.status(200).json({ message: 'Verification code sent' });
};

exports.signup = async (req, res) => {
  const { email, verificationCode } = req.body;

  const snapshot = await db.collection('users').where('email', '==', email).get();

  if (snapshot.empty) {
    return res.status(401).json({ error: 'User not found' });
  }

  const doc = snapshot.docs[0];
  const userData = doc.data();

  if (userData.verificationCode !== verificationCode) {
    return res.status(401).json({ error: 'Invalid verification code' });
  }

  await doc.ref.update({ verified: true });

  res.status(201).json({ id: doc.id, email });
};


exports.signin = async (req, res) => {
  const { email, verificationCode } = req.body;

  // Tìm user theo email
  const snapshot = await db.collection('users').where('email', '==', email).get();

  if (snapshot.empty) {
    return res.status(401).json({ error: 'Invalid email or code' });
  }

  const doc = snapshot.docs[0];
  const userData = doc.data();

  if (userData.verificationCode !== verificationCode || !userData.verified) {
    return res.status(401).json({ error: 'Invalid email or code' });
  }

  const token = jwt.sign({ userId: doc.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({ accessToken: token });
};


// GitHub OAuth
exports.githubOAuth = async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange GitHub code for access token
    const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, null, {
      params: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      headers: {
        accept: 'application/json',
      },
    });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return res.status(401).json({ error: 'GitHub auth failed' });

    // Get GitHub user profile
    const profileResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubEmail = profileResponse.data.email || profileResponse.data.login;

    // Save to Firestore (if chưa có)
    const userRef = db.collection('users').doc(githubEmail);
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({
        email: githubEmail,
        githubId: profileResponse.data.id,
        verified: true,
        createdAt: new Date().toISOString(),
      });
    }

    const token = jwt.sign({ userId: githubEmail }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ accessToken: token });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'GitHub OAuth failed' });
  }
};

exports.getUser = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Không có token' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.userId;

    const userRef = db.doc(`users/${id}`);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'User không tồn tại.' });
    }

    const userData = userSnapshot.data();
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Lỗi khi lấy user:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy user.' });
  }
};

exports.updateUser = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Không có token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { verificationCode } = req.body;

    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    await userRef.update({
      ...(verificationCode && { verificationCode }),
    });

    const updatedUser = (await userRef.get()).data();
    return res.status(200).json({ message: 'Cập nhật thành công.', user: updatedUser });
  } catch (error) {
    console.error('Lỗi cập nhật user:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật user.' });
  }
};
const { db } = require('../firebase/firebase');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const axios = require('axios');

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await db.collection('users').doc(email).set({
    email,
    verificationCode: code,
    verified: false,
    createdAt: new Date().toISOString()
  }, { merge: true });

  await sendEmail(email, 'Your Verification Code', `Your code is: ${code}`);
  res.status(200).json({ message: 'Verification code sent' });
};

exports.signup = async (req, res) => {
  const { email, verificationCode } = req.body;
  const userRef = db.collection('users').doc(email);
  const doc = await userRef.get();

  if (!doc.exists || doc.data().verificationCode !== verificationCode) {
    return res.status(401).json({ error: 'Invalid verification code' });
  }

  await userRef.update({ verified: true });
  res.status(201).json({ id: doc.id, email });
};

exports.signin = async (req, res) => {
  const { email, verificationCode } = req.body;
  const doc = await db.collection('users').doc(email).get();

  if (!doc.exists || doc.data().verificationCode !== verificationCode || !doc.data().verified) {
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

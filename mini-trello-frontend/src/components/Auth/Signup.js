import React, { useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);

  const handleSendCode = async () => {
    try {
      await api.post('/auth/send-code', { email });
      alert('✅ Mã xác minh đã gửi đến email');
      setStep(2);
    } catch (err) {
      alert('❌ Không thể gửi mã');
    }
  };

  const handleSignup = async () => {
    try {
      await api.post('/auth/signup', {
        email,
        verificationCode: code
      });
      alert('🎉 Đăng ký thành công! Hãy đăng nhập.');
    } catch (err) {
      alert('❌ Đăng ký thất bại. Mã không đúng hoặc đã đăng ký.');
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: '0 auto', padding: 16 }}>
      <h2>✍️ Đăng ký</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />

      {step === 1 ? (
        <button onClick={handleSendCode}>Gửi mã xác minh</button>
      ) : (
        <>
          <input
            placeholder="Mã xác minh"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <button onClick={handleSignup}>Đăng ký</button>
        </>
      )}
      <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </div>
  );
};

export default Signup;

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
    <div style={{
      maxWidth: 360,
      margin: '50px auto',
      padding: 24,
      backgroundColor: '#fff',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>✍️ Đăng ký</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 16,
          borderRadius: 6,
          border: '1px solid #ccc',
          fontSize: 14
        }}
      />

      {step === 1 ? (
        <button
          onClick={handleSendCode}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#28a745',
            color: '#fff',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          Gửi mã xác minh
        </button>
      ) : (
        <>
          <input
            placeholder="Mã xác minh"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 16,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 14
            }}
          />
          <button
            onClick={handleSignup}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Đăng ký
          </button>
        </>
      )}

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
        Đã có tài khoản? <Link to="/login" style={{ color: '#007bff' }}>Đăng nhập</Link>
      </p>
    </div>
  );
};

export default Signup;

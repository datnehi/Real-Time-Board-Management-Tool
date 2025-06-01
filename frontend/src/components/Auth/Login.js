import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();


    const handleLogin = async () => {
        try {
            const res = await api.post('/auth/signin', {
                email,
                verificationCode: code
            });

            const { accessToken } = res.data;
            login({ token: accessToken });
            alert('✅ Đăng nhập thành công!');
            navigate('/boardList');
        } catch (err) {
            alert('❌ Sai mã xác minh hoặc email');
        }
    };

    return (
        <div style={{ maxWidth: 300, margin: '0 auto', padding: 16 }}>
            <h2>🔐 Đăng nhập</h2>
            <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', marginBottom: 8 }}
            />
            <input
                placeholder="Mã xác minh"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ width: '100%', marginBottom: 8 }}
            />
            <button onClick={handleLogin}>Đăng nhập</button>

            <p>
                Bạn chưa có tài khoản? <Link to="/signup">Đăng ký</Link>
            </p>
        </div>
    );
};

export default Login;

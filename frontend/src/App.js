import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardList from './components/Boards/BoardList';
import Login from './components/Auth/Login';
import { AuthProvider } from './context/AuthContext';
import Signup from './components/Auth/Signup';
import CardList from './components/Cards/CardList';
import Profile from './components/Profile/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import TaskDetail from './components/Tasks/TaskDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/boardList"
            element={
              <ProtectedRoute>
                <BoardList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:boardId/cards"
            element={
              <ProtectedRoute>
                <CardList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:boardId/cards/:cardId/tasks/:taskId"
            element={
              <ProtectedRoute>
                < TaskDetail/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

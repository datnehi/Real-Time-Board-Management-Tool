import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import DashboardLayout from '../Layout/DashboardLayout';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const BoardList = () => {
    const { user } = useAuth();
    const [boards, setBoards] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [boardName, setBoardName] = useState('');
    const [boardDesc, setBoardDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const token = user.token;
    const decoded = jwtDecode(token);
    const userId = decoded.userId;

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await api.get('/boards');
                setBoards(res.data);
            } catch (err) {
                console.error('Lỗi lấy danh sách bảng', err);
            }
        };
        fetchBoards();

        const handleBoardCreated = (data) => {
            setBoards(prev => [...prev, { id: data.boardId, ...data.board }]);
        };
        const handleBoardUpdated = (data) => {
            setBoards(prev => prev.map(b => (b.id === data.boardId ? { ...b, ...data.updates } : b)));
        };
        const handleBoardDeleted = (data) => {
            setBoards(prev => prev.filter(b => b.id !== data.boardId));
        };

        socket.on('board_created', handleBoardCreated);
        socket.on('board_updated', handleBoardUpdated);
        socket.on('board_deleted', handleBoardDeleted);

        return () => {
            socket.off('board_created', handleBoardCreated);
            socket.off('board_updated', handleBoardUpdated);
            socket.off('board_deleted', handleBoardDeleted);
        };
    }, []);

    const openCreateModal = () => {
        setBoardName('');
        setBoardDesc('');
        setShowModal(true);
    };

    const openEditModal = (board) => {
        setEditingBoard(board);
        setBoardName(board.name);
        setBoardDesc(board.description);
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowModal(false);
        setShowEditModal(false);
        setEditingBoard(null);
    };

    const handleCreateBoard = async () => {
        if (!boardName.trim()) return alert('Nhập tên bảng');
        setLoading(true);

        try {
            const res = await api.post('/boards', {
                name: boardName.trim(),
                description: boardDesc.trim(),
            });

            setBoards(prev => [...prev, res.data]);
            closeModals();
        } catch (err) {
            alert('Tạo bảng thất bại');
            console.error(err);
        }

        setLoading(false);
    };

    const handleEditBoard = async () => {
        if (!boardName.trim()) return alert('Nhập tên bảng');
        setLoading(true);
        try {
            const res = await api.put(`/boards/${editingBoard.id}`, {
                name: boardName.trim(),
                description: boardDesc.trim(),
            });
            setBoards(prev => prev.map(b => b.id === editingBoard.id ? res.data : b));
            closeModals();
        } catch (err) {
            alert('Cập nhật bảng thất bại');
            console.error(err);
        }
        setLoading(false);
    };

    const handleDeleteBoard = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bảng này không?')) return;
        try {
            await api.delete(`/boards/${id}`);
            setBoards(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            alert('Xóa bảng thất bại');
            console.error(err);
        }
    };

    return (
        <DashboardLayout>
            <div style={styles.container}>
                <h2 style={styles.heading}>🗂️ Danh sách bảng</h2>

                <div style={styles.boardList}>
                    {boards.map(board => (
                        <div key={board.id} style={styles.boardItem}>
                            <Link to={`/boards/${board.id}/cards`} style={styles.boardLink}>
                                <h3 style={styles.boardTitle}>{board.name}</h3>
                                <p style={styles.boardDesc}>{board.description || 'Không có mô tả'}</p>
                            </Link>
                            {board.ownerId === userId && (
                                <div style={styles.boardActions}>
                                    <button onClick={() => openEditModal(board)} style={styles.actionButton}>✏️</button>
                                    <button onClick={() => handleDeleteBoard(board.id)} style={styles.deleteButton}>✖</button>
                                </div>
                            )}
                        </div>
                    ))}

                    <div onClick={openCreateModal} style={styles.createBoard}>
                        + Tạo bảng mới
                    </div>
                </div>

                {(showModal || showEditModal) && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <h3>{showModal ? 'Tạo bảng mới' : 'Chỉnh sửa bảng'}</h3>
                            <label>
                                Tên bảng:
                                <input
                                    value={boardName}
                                    onChange={e => setBoardName(e.target.value)}
                                    disabled={loading}
                                    style={styles.input}
                                />
                            </label>
                            <br />
                            <label>
                                Mô tả:
                                <textarea
                                    value={boardDesc}
                                    onChange={e => setBoardDesc(e.target.value)}
                                    rows={3}
                                    disabled={loading}
                                    style={styles.textarea}
                                />
                            </label>
                            <div style={styles.modalActions}>
                                <button onClick={showModal ? handleCreateBoard : handleEditBoard} disabled={loading}>
                                    {loading ? 'Đang xử lý...' : showModal ? 'Tạo' : 'Lưu'}
                                </button>
                                <button onClick={closeModals} style={{ marginLeft: 10 }} disabled={loading}>Huỷ</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>

    );
};

const styles = {
  container: {
    padding: 24,
  },
  heading: {
    fontSize: 24,
    marginBottom: 16,
  },
  boardList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
  },
  boardItem: {
    position: 'relative',
    width: 220,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#f4f5f7',
    padding: 12,
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    transition: 'transform 0.2s',
  },
  boardLink: {
    textDecoration: 'none',
    color: '#172b4d',
    display: 'block',
    height: '100%',
  },
  boardTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  boardDesc: {
    fontSize: 14,
    color: '#5e6c84',
  },
  boardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    display: 'flex',
    gap: 6,
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#c00',
    fontSize: 16,
    cursor: 'pointer',
  },
  createBoard: {
    width: 220,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#e2e4e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#555',
    cursor: 'pointer',
    boxShadow: 'inset 0 0 0 2px #c4c9cc',
    transition: 'background-color 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    minWidth: 320,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  input: {
    width: '100%',
    marginBottom: 12,
    padding: 8,
  },
  textarea: {
    width: '100%',
    marginBottom: 12,
    padding: 8,
  },
  modalActions: {
    textAlign: 'right',
  }
};

export default BoardList;

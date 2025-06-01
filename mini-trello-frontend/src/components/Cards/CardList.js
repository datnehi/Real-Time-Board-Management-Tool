import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import DashboardLayout from '../Layout/DashboardLayout';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const CardList = () => {
  const { boardId } = useParams();
  const [board, setBoards] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Form inputs
  const [cardName, setCardName] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [editCardId, setEditCardId] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskCardId, setTaskCardId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [boardMembers, setBoardMembers] = useState([]);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await api.get(`/boards/${boardId}`);
        setBoards(res.data);
      } catch (err) {
        console.error('Lỗi lấy danh sách bảng', err);
      }
    };
    const fetchBoardMembers = async () => {
      try {
        const res = await api.get(`/boards/${boardId}/members`);
        setBoardMembers(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thành viên của board:', err);
      }
    };
    fetchBoards();
    fetchCards();
    fetchBoardMembers();

    // Listen socket update for realtime sync
    socket.on('card_updated', updatedCard => {
      setCards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)));
    });
    socket.on('card_created', newCard => {
      setCards(prev => [...prev, newCard]);
    });
    socket.on('card_deleted', deletedCardId => {
      setCards(prev => prev.filter(c => c.id !== deletedCardId));
    });
    socket.on('task_updated', updatedTask => {
      setCards(prev => prev.map(card => {
        if (card.id === updatedTask.cardId) {
          const newTasks = card.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
          return { ...card, tasks: newTasks };
        }
        return card;
      }));
    });
    socket.on('task_created', newTask => {
      setCards(prev => prev.map(card => {
        if (card.id === newTask.cardId) {
          return { ...card, tasks: [...card.tasks, newTask] };
        }
        return card;
      }));
    });
    socket.on('task_deleted', ({ taskId, cardId }) => {
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return { ...card, tasks: card.tasks.filter(t => t.id !== taskId) };
        }
        return card;
      }));
    });

    return () => {
      socket.off('card_updated');
      socket.off('card_created');
      socket.off('card_deleted');
      socket.off('task_updated');
      socket.off('task_created');
      socket.off('task_deleted');
    };
  }, [boardId]);

  async function fetchCards() {
    setLoading(true);
    try {
      const res = await api.get(`/boards/${boardId}/cards`);
      setCards(res.data);
      console.log(res.data);
    } catch (error) {
      console.error('Lỗi lấy card', error);
    }
    setLoading(false);
  }

  // Thêm hoặc sửa card
  const handleSaveCard = async () => {
    if (!cardName.trim()) return alert('Tên thẻ không được để trống');
    try {
      if (editCardId) {
        // Sửa card
        const res = await api.put(`/boards/${boardId}/cards/${editCardId}`, {
          name: cardName,
          description: cardDescription,
        });
        setCards(cards.map(c => (c.id === editCardId ? res.data : c)));
      } else {
        // Tạo mới
        const res = await api.post(`/boards/${boardId}/cards`, {
          name: cardName,
          description: cardDescription,
        });
        setCards([...cards, res.data]);
      }
      setShowCardModal(false);
      setCardName('');
      setCardDescription('');
      setEditCardId(null);
    } catch (error) {
      console.error('Lỗi lưu card', error);
    }
  };

  // Xoá card
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Bạn có chắc muốn xoá thẻ này?')) return;
    try {
      await api.delete(`/boards/${boardId}/cards/${cardId}`);
      setCards(cards.filter(c => c.id !== cardId));
    } catch (error) {
      console.error('Lỗi xoá card', error);
    }
  };

  // Mở modal sửa card
  const openEditCardModal = (card) => {
    setCardName(card.name);
    setCardDescription(card.description || '');
    setEditCardId(card.id);
    setShowCardModal(true);
  };

  // Modal thêm task
  const openAddTaskModal = (cardId) => {
    setTaskCardId(cardId);
    setTaskName('');
    setTaskDescription('');
    setEditTaskId(null);
    setShowTaskModal(true);
  };

  // Thêm hoặc sửa task
  const handleSaveTask = async () => {
    if (!taskName.trim()) return alert('Tên công việc không được để trống');

    try {
      await api.post(`/boards/${boardId}/cards/${taskCardId}/tasks`, {
        title: taskName,
        description: taskDescription
      });
      const res1 = await api.get(`/boards/${boardId}/cards`);
      setCards(res1.data);

      // reset modal, form
      setShowTaskModal(false);
      setTaskName('');
      setTaskDescription('');
      setEditTaskId(null);
      setTaskCardId(null);
    } catch (error) {
      console.error('Lỗi lưu task:', error);
    }
  };

  // Xoá task
  const handleDeleteTask = async (taskId, cardId) => {
    if (!window.confirm('Bạn có chắc muốn xoá công việc này?')) return;
    try {
      await api.delete(`/boards/${boardId}/cards/${taskCardId}/tasks/${taskId}`);
      setCards(cards.map(card => {
        if (card.id === cardId) {
          return { ...card, tasks: card.tasks.filter(t => t.id !== taskId) };
        }
        return card;
      }));
    } catch (error) {
      console.error('Lỗi xoá task', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return alert("Vui lòng nhập email");

    try {
      const res = await api.post(`/boards/${boardId}/invite`, {
        board_owner_id: board.ownerId,
        email_member: inviteEmail,
      });

      if (res.data.success) {
        alert("Đã gửi lời mời!");
        setShowInviteModal(false);
      }
    } catch (error) {
      console.error("Lỗi khi mời:", error);
      alert("Có lỗi xảy ra. Kiểm tra lại email hoặc kết nối.");
    }
  };

  // Mở modal sửa task
  const openEditTaskModal = (task, cardId) => {
    setTaskName(task.name);
    setTaskDescription(task.description);
    setEditTaskId(task.id);
    setTaskCardId(cardId);
    setShowTaskModal(true);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceCardIndex = cards.findIndex(c => c.id === source.droppableId);
    const destCardIndex = cards.findIndex(c => c.id === destination.droppableId);

    const sourceTasks = Array.from(cards[sourceCardIndex].tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, movedTask);
      const newCards = [...cards];
      newCards[sourceCardIndex].tasks = sourceTasks;
      setCards(newCards);
    } else {
      const destTasks = Array.from(cards[destCardIndex].tasks);
      destTasks.splice(destination.index, 0, movedTask);
      const newCards = [...cards];
      newCards[sourceCardIndex].tasks = sourceTasks;
      newCards[destCardIndex].tasks = destTasks;
      setCards(newCards);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex' }}>
        {/* Sidebar Member Filter */}
        <div style={{ width: 220, paddingRight: 16 }}>
          <h4 style={{ fontWeight: 600, color: '#172b4d', marginBottom: 12 }}>Thành viên</h4>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              marginBottom: 8,
              backgroundColor: '#dfe1e6',
              border: 'none',
              borderRadius: 4,
              textAlign: 'left',
              fontWeight: 600,
              color: '#172b4d',
              cursor: 'pointer',
            }}
          >
            🔁 Tất cả
          </button>
          {(boardMembers || []).map(member => (
            <button
              key={member.id}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 12px',
                marginBottom: 8,
                border: 'none',
                borderRadius: 4,
                textAlign: 'left',
                fontWeight: 500,
                color: '#172b4d',
                cursor: 'pointer',
              }}
            >
              👤 {member.email}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              paddingBottom: 10,
              height: 'calc(100vh - 200px)',
            }}
          >
            <div style={{ padding: 20, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f4f5f7', minHeight: '100vh' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <h2 style={{ color: '#172b4d', fontWeight: 600 }}>
                  Board: {board.name}
                </h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    backgroundColor: '#0052cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Mời thành viên
                </button>
              </div>
              <button
                onClick={() => setShowCardModal(true)}
                style={{
                  marginBottom: 20,
                  backgroundColor: '#5aac44',
                  color: 'white',
                  border: 'none',
                  borderRadius: 3,
                  padding: '8px 12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 0 rgba(9,30,66,.25)',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#519839')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5aac44')}
              >
                + Thêm Thẻ Mới
              </button>

              {loading && <p style={{ color: '#5e6c84' }}>Đang tải dữ liệu...</p>}
              <DragDropContext onDragEnd={onDragEnd}>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    overflowX: 'auto',
                    paddingBottom: 10,
                    height: 'calc(80vh - 200px)',
                  }}
                >
                  {cards.map(card => (
                    <Droppable droppableId={card.id} key={card.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: 8,
                            padding: 16,
                            minWidth: 280,
                            maxHeight: '100%',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#172b4d', margin: 0, wordBreak: 'break-word' }}>{card.name}</h3>
                              <div>
                                <button
                                  onClick={() => openEditCardModal(card)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#6b778c',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginRight: 8,
                                    fontSize: 14,
                                    padding: '4px 8px',
                                    borderRadius: 3,
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(card.id)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#b04632',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    padding: '4px 8px',
                                    borderRadius: 3,
                                  }}
                                >
                                  Xoá
                                </button>
                              </div>
                            </div>

                            <p style={{ fontSize: 14, color: '#5e6c84', marginBottom: 12, whiteSpace: 'pre-wrap', minHeight: 40 }}>
                              {card.description}
                            </p>

                            <h4 style={{ fontWeight: 600, fontSize: 15, color: '#172b4d', marginBottom: 8 }}>Công việc</h4>
                            <ul style={{ paddingLeft: 0, margin: 0, maxHeight: 240, overflowY: 'auto', listStyle: 'none' }}>
                              {(card.tasks || []).map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided) => (
                                    <li
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        marginBottom: 8,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: 14,
                                        color: '#172b4d',
                                        backgroundColor: '#f4f5f7',
                                        padding: '6px 8px',
                                        borderRadius: 4,
                                        boxShadow: 'inset 0 0 0 1px rgba(9,30,66,.08)',
                                        cursor: 'grab',
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      <span style={{ wordBreak: 'break-word', flex: 1 }}>{task.title}</span>
                                      <div style={{ marginLeft: 8, flexShrink: 0 }}>
                                        <Link to={`/boards/${boardId}/cards/${card.id}/tasks/${task.id}`}>
                                          <button
                                            onClick={() => openEditTaskModal(task, card.id)}
                                            style={{
                                              backgroundColor: 'transparent',
                                              border: 'none',
                                              color: '#6b778c',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              marginRight: 6,
                                              fontSize: 12,
                                              padding: '2px 6px',
                                              borderRadius: 3,
                                            }}
                                          >
                                            Sửa
                                          </button>
                                        </Link>
                                        <button
                                          onClick={() => handleDeleteTask(task.id, card.id)}
                                          style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            color: '#b04632',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            padding: '2px 6px',
                                            borderRadius: 3,
                                          }}
                                        >
                                          Xoá
                                        </button>
                                      </div>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </ul>

                            <button
                              onClick={() => openAddTaskModal(card.id)}
                              style={{
                                marginTop: 8,
                                backgroundColor: '#5aac44',
                                color: 'white',
                                border: 'none',
                                borderRadius: 3,
                                padding: '8px 12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 0 rgba(9,30,66,.25)',
                              }}
                            >
                              + Thêm công việc
                            </button>
                          </div>
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </DragDropContext>
              {/* Modal mời thành viên */}
              {showInviteModal && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 9999
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: 8,
                    padding: 24,
                    width: 360,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}>
                    <h3 style={{ marginBottom: 16, color: '#172b4d' }}>Mời thành viên vào bảng</h3>
                    <input
                      type="email"
                      placeholder="Nhập email..."
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 10,
                        marginBottom: 16,
                        borderRadius: 4,
                        border: '1px solid #dfe1e6'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setShowInviteModal(false)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#6b778c',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleInvite}
                        style={{
                          backgroundColor: '#0052cc',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 4,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Mời
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Thêm / Sửa Card */}
              {showCardModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#fff',
                      padding: 24,
                      borderRadius: 8,
                      minWidth: 360,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: 16, fontWeight: 700, color: '#172b4d' }}>
                      {editCardId ? 'Sửa Thẻ' : 'Thêm Thẻ Mới'}
                    </h3>
                    <input
                      type="text"
                      placeholder="Tên thẻ"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      style={{
                        width: '100%',
                        marginBottom: 16,
                        padding: 10,
                        borderRadius: 4,
                        border: '1px solid #dfe1e6',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      placeholder="Mô tả (tuỳ chọn)"
                      value={cardDescription}
                      onChange={e => setCardDescription(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        marginBottom: 16,
                        padding: 10,
                        borderRadius: 4,
                        border: '1px solid #dfe1e6',
                        fontSize: 14,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setShowCardModal(false)}
                        style={{
                          marginRight: 12,
                          backgroundColor: '#eb5a46',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d0453e')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#eb5a46')}
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={handleSaveCard}
                        style={{
                          backgroundColor: '#5aac44',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 0 rgba(0,0,0,0.25)',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#519839')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5aac44')}
                      >
                        {editCardId ? 'Lưu' : 'Thêm'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Thêm / Sửa Task */}
              {showTaskModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#fff',
                      padding: 24,
                      borderRadius: 8,
                      minWidth: 360,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: 16, fontWeight: 700, color: '#172b4d' }}>
                      {editTaskId ? 'Sửa Công Việc' : 'Thêm Công Việc Mới'}
                    </h3>
                    <input
                      type="text"
                      placeholder="Tên công việc"
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      style={{
                        width: '100%',
                        marginBottom: 16,
                        padding: 10,
                        borderRadius: 4,
                        border: '1px solid #dfe1e6',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      placeholder="Mô tả (tuỳ chọn)"
                      value={cardDescription}
                      onChange={e => setTaskDescription(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        marginBottom: 16,
                        padding: 10,
                        borderRadius: 4,
                        border: '1px solid #dfe1e6',
                        fontSize: 14,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setShowTaskModal(false)}
                        style={{
                          marginRight: 12,
                          backgroundColor: '#eb5a46',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d0453e')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#eb5a46')}
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={handleSaveTask}
                        style={{
                          backgroundColor: '#5aac44',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 0 rgba(0,0,0,0.25)',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#519839')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5aac44')}
                      >
                        {editTaskId ? 'Lưu' : 'Thêm'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div >
    </DashboardLayout >
  );
};

export default CardList;

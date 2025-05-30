const { db } = require('../firebase/firebase');

// GET /boards/:boardId/cards/:cardId/tasks
exports.getTasks = async (req, res) => {
  const { boardId, cardId } = req.params;
  try {
    const snapshot = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').get();

    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách task' });
  }
};

// POST /boards/:boardId/cards/:cardId/tasks
exports.createTask = async (req, res) => {
  const { boardId, cardId } = req.params;
  const { title, description, status = 'icebox', ownerId } = req.body;

  try {
    const newTask = {
      title,
      description,
      status,
      ownerId,
      createdAt: new Date().toISOString()
    };

    const taskRef = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').add(newTask);

    // ✅ Emit socket
    const io = req.app.get('io');
    io.to(boardId).emit('task_created', {
      boardId,
      cardId,
      taskId: taskRef.id,
      task: newTask
    });

    res.status(201).json({ id: taskRef.id, ...newTask });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tạo task' });
  }
};

// GET /boards/:boardId/cards/:cardId/tasks/:taskId
exports.getTaskById = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  try {
    const taskDoc = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy task' });
    }

    res.status(200).json({ id: taskDoc.id, ...taskDoc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy task' });
  }
};

// PUT /boards/:boardId/cards/:cardId/tasks/:taskId
exports.updateTask = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const updates = req.body;

  try {
    const updatedTask = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId).update(updatedTask);

    // ✅ Emit socket
    const io = req.app.get('io');
    io.to(boardId).emit('task_updated', {
      boardId,
      cardId,
      taskId,
      updates: updatedTask
    });

    res.status(200).json({ id: taskId, ...updatedTask });
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật task' });
  }
};

// DELETE /boards/:boardId/cards/:cardId/tasks/:taskId
exports.deleteTask = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;

  try {
    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId).delete();

    // ✅ Emit socket
    const io = req.app.get('io');
    io.to(boardId).emit('task_deleted', {
      boardId,
      cardId,
      taskId
    });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa task' });
  }
};

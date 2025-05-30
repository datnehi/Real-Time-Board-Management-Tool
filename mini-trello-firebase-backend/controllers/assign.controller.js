const { db } = require('../firebase/firebase');

// Gán người vào task
exports.assignMember = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const { memberId } = req.body;

  try {
    const assignment = {
      memberId,
      assignedAt: new Date().toISOString()
    };

    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('assignments').doc(memberId).set(assignment);

    // Emit socket event
    const io = req.app.get('io');
    io.to(boardId).emit('task_assigned', {
      boardId,
      cardId,
      taskId,
      memberId
    });

    res.status(201).json({ taskId, memberId });
  } catch (err) {
    res.status(500).json({ error: 'Không thể gán người vào task' });
  }
};

// Lấy danh sách người được gán
exports.getAssignedMembers = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;

  try {
    const snapshot = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('assignments').get();

    const members = snapshot.docs.map(doc => doc.data());
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách người được gán' });
  }
};

// Xoá người khỏi task
exports.removeAssignedMember = async (req, res) => {
  const { boardId, cardId, taskId, memberId } = req.params;

  try {
    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('assignments').doc(memberId).delete();

    // Emit socket event
    const io = req.app.get('io');
    io.to(boardId).emit('task_unassigned', {
      boardId,
      cardId,
      taskId,
      memberId
    });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xoá người được gán' });
  }
};

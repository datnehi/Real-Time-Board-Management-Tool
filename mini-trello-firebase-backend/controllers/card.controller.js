const { db, admin } = require('../firebase/firebase');

// GET /boards/:boardId/cards
exports.getAllCards = async (req, res) => {
  const { boardId } = req.params;
  try {
    const snapshot = await db.collection('boards').doc(boardId).collection('cards').get();
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách thẻ' });
  }
};

// POST /boards/:boardId/cards
exports.createCard = async (req, res) => {
  const { boardId } = req.params;
  const { name, description, createdAt, members = [], tasks_count = 0 } = req.body;

  try {
    const newCard = {
      name,
      description,
      createdAt: createdAt || new Date().toISOString(),
      members,
      tasks_count,
    };

    const docRef = await db.collection('boards').doc(boardId).collection('cards').add(newCard);

    // Emit socket event
    const io = req.app.get('io');
    io.to(boardId).emit('card_created', {
      boardId,
      cardId: docRef.id,
      card: newCard
    });

    res.status(201).json({ id: docRef.id, ...newCard });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tạo thẻ' });
  }
};

// GET /boards/:boardId/cards/:id
exports.getCardById = async (req, res) => {
  const { boardId, id } = req.params;
  try {
    const doc = await db.collection('boards').doc(boardId).collection('cards').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy thẻ' });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy thẻ' });
  }
};

// PUT /boards/:boardId/cards/:id
exports.updateCard = async (req, res) => {
  const { boardId, id } = req.params;
  const { name, description, ...params } = req.body;

  try {
    const updatedCard = {
      name,
      description,
      ...params,
      updatedAt: new Date().toISOString()
    };

    await db.collection('boards').doc(boardId).collection('cards').doc(id).update(updatedCard);

    // Emit socket event
    const io = req.app.get('io');
    io.to(boardId).emit('card_updated', {
      boardId,
      cardId: id,
      updates: updatedCard
    });

    res.status(200).json({ id, ...updatedCard });
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật thẻ' });
  }
};

// DELETE /boards/:boardId/cards/:id
exports.deleteCard = async (req, res) => {
  const { boardId, id } = req.params;

  try {
    await db.collection('boards').doc(boardId).collection('cards').doc(id).delete();

    // Emit socket event
    const io = req.app.get('io');
    io.to(boardId).emit('card_deleted', {
      boardId,
      cardId: id
    });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa thẻ' });
  }
};

// GET /boards/:boardId/cards/user/:user_id
exports.getCardsByUser = async (req, res) => {
  const { boardId, user_id } = req.params;
  try {
    const snapshot = await db.collection('boards').doc(boardId).collection('cards')
      .where('members', 'array-contains', user_id).get();

    const cards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy thẻ theo người dùng' });
  }
};

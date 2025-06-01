const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
const cardController = require('../controllers/card.controller');

// Lấy tất cả thẻ trong board
router.get('/', authMiddleware, cardController.getAllCards);

// Tạo thẻ mới
router.post('/', authMiddleware, cardController.createCard);

// Lấy thông tin chi tiết của 1 thẻ
router.get('/:id', authMiddleware, cardController.getCardById);

// Cập nhật thẻ
router.put('/:id', authMiddleware, cardController.updateCard);

// Xóa thẻ
router.delete('/:id', authMiddleware, cardController.deleteCard);

// Lấy các thẻ theo user
router.get('/user/:user_id', authMiddleware, cardController.getCardsByUser);

module.exports = router;

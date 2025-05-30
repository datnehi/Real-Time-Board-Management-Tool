const express = require('express');
const router = express.Router({ mergeParams: true });
const cardController = require('../controllers/card.controller');

// Lấy tất cả thẻ trong board
router.get('/', cardController.getAllCards);

// Tạo thẻ mới trong board
router.post('/', cardController.createCard);

// Lấy chi tiết 1 thẻ
router.get('/:id', cardController.getCardById);

// Cập nhật thẻ
router.put('/:id', cardController.updateCard);

// Xoá thẻ
router.delete('/:id', cardController.deleteCard);

// Lấy thẻ theo user
router.get('/user/:user_id', cardController.getCardsByUser);

module.exports = router;

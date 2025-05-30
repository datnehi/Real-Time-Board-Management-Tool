const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/task.controller');

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.get('/:taskId', taskController.getTaskById);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;

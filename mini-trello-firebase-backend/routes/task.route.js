const express = require('express');
const router = express.Router({ mergeParams: true }); 
const authMiddleware = require('../middleware/auth');
const taskController = require('../controllers/task.controller');

router.get('/', authMiddleware, taskController.getTasks);

router.post('/', authMiddleware, taskController.createTask);

router.get('/:taskId', authMiddleware, taskController.getTaskById);

router.put('/:taskId', authMiddleware, taskController.updateTask);

router.delete('/:taskId', authMiddleware, taskController.deleteTask);

router.post('/:taskId/move', authMiddleware, taskController.changecard);

router.post('/:taskId/assign', authMiddleware, taskController.assignMemberToTask);

router.get('/:taskId/assign', authMiddleware, taskController.getAssignedMembers);

router.delete('/:taskId/assign/:memberId', authMiddleware, taskController.removeAssignedMember);

router.post('/:taskId/github-attach', authMiddleware, taskController.attachGithubToTask);

router.get('/:taskId/github-attachments', authMiddleware, taskController.getGithubAttachments);

router.delete('/:taskId/github-attachments/:attachmentId', authMiddleware, taskController.deleteGithubAttachment);

module.exports = router;

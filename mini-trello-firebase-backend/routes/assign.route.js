const express = require('express');
const router = express.Router({ mergeParams: true });
const assignController = require('../controllers/assign.controller');

router.post('/', assignController.assignMember);
router.get('/', assignController.getAssignedMembers);
router.delete('/:memberId', assignController.removeAssignedMember);

module.exports = router;

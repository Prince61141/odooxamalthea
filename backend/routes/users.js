const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', auth, requireAdmin, userController.listAll);
router.post('/', auth, requireAdmin, userController.createUser);
router.delete('/:id', auth, requireAdmin, userController.deleteUser);
router.get('/managers', auth, requireAdmin, userController.listManagers);
router.post('/invite', auth, requireAdmin, userController.sendInvite);
router.get('/summary', auth, requireAdmin, userController.summary);

module.exports = router;
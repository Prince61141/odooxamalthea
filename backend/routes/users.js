const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.post('/', auth, requireAdmin, userController.createUser);
router.get('/managers', auth, requireAdmin, userController.listManagers);
router.post('/invite', auth, requireAdmin, userController.sendInvite);

module.exports = router;
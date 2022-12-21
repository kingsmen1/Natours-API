const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
  getBookings,
} = require('../controllers/userControllers');
const authController = require('../controllers/authControllers');

//Creating router variable.
const router = express.Router();

//Routes.
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//*As "router" is a middleare & runs in sequence we are adding protect middleware to
//*all routes which comes after it.
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', getMe, getUser);

router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

//Get current user bookings
router.route('/:id/bookings').get(getBookings);

router.use(authController.restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

const express = require('express');

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
  checkifAuther,
  checkIfBooked,
} = require('../controllers/reviewsController');

const authController = require('../controllers/authControllers');

//merger params will access the params from the other router ex:we getting tourId from
//tourRouter.
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(getAllReviews)
  .post(
    authController.restrictTo('user'),
    setTourUserIds,
    checkIfBooked,
    createReview
  );

router
  .route('/:id')
  .get(getReview)
  .patch(checkifAuther, updateReview)
  .delete(checkifAuther, deleteReview);

module.exports = router;

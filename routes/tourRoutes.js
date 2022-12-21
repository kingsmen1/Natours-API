const express = require('express');
const tourControllers = require('../controllers/tourControllers');
const authController = require('../controllers/authControllers');
const reviewRouter = require('./reviewsRoutes');

const router = express.Router();

//router param(middleware) check if given condition's
//with id is met if-not will end response cycle.
// router.param('id', tourControllers.checkID);

//mounting review router.
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route('/tour-stats').get(tourControllers.getTourStats);
router
  .route('/mothly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.getMontlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourControllers.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourControllers.getDistances);

router
  .route('/')
  .get(tourControllers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.createTour
  );

router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.uploadTourImages,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .delete(
    authController.protect,
    //restrictTo passes the roles that can be perform the actions.
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.deleteTour
  );

router.route('/:id/bookings').get(tourControllers.getBookings);

module.exports = router;

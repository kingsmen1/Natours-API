const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes.
  //If user doesn't provide tour property in review body
  //we assigning tour from params Id.Same goes with user
  //we getting user from protect middleware.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.checkifAuther = async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (req.user.role !== 'admin') {
    if (req.user.id !== review.user.id)
      next(new AppError(`You cannot edit/delete someone's else review.`, 403));
  }
  next();
};

exports.checkIfBooked = catchAsync(async (req, res, next) => {
  //^find({}) always returns an array.
  const bookings = await Booking.find({
    tour: req.body.tour,
    user: req.body.user,
  });
  if (bookings.length === 0)
    return next(new AppError('Please book the tour', 401));
  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

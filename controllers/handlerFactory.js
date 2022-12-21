const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIfeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document is found by this id', 404));
    }
    res.status(204).json({
      status: 'Success',
      data: doc,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.body.imageCover);
    console.log('-------');
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document is found by this id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.params);
    //*similar method Tour.findOne({_id:req.params.id});
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document is found by this id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour(hack).
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // console.log(req.query);  //query is after "?" doc?price[lt]=1500&sort=-ratingsAverage.
    // console.log(req.params); //params is last number/id after "/" doc/5.
    //Execute query.
    //^ we can use where ,equals methods as find returns a query object.
    const features = new APIfeatures(Model.find(filter), req.query)
      // .filter()
      .sort()
      .limitFields()
      .paginate()
      .filter();
    const doc = await features.query;
    //^.explain() gives statisctics of the response.
    //features.query.explain();
    res.status(200).json({
      status: 'success',
      results: doc.length,
      requestedTime: req.requestTime,
      data: {
        data: doc,
      },
    });
  });

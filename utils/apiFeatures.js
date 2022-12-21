// //!Api Features Class.
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  //*Filtering queryString
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    //^if using operator in query we r adding $ in front of them by Regex.
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    //returning this.query;
    return this;
  }

  //*Sorting.
  sort() {
    if (this.queryString.sort) {
      //^doing it for creating space in sort fields
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      //if no sort is specified, we're still applying a default sorts here.
      //newest ones appears first
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  //*Projecting /Field limiting .
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  //* Pagination.
  paginate() {
    //^ "||" gives default value .
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //^"skip" skips the given number of items & "limit" gives next given number of items.
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;

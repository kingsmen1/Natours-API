/* 
class Calculator {
  add(a, b) {
    return a + b;
  }
  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    return a / b;
  }
}
*/

//exporting method one
module.exports = class {
  add(a, b) {
    return a + b;
  }
  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    return a / b;
  }
};

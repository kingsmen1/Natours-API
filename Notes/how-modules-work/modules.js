//List all the arguments present in the function .
/*console.log(arguments);*/

//Gives the wrapper function from the 'module' which node uses internally .
/* console.log(require('module').wrapper);*/

//module.exports
const C = require('./test-module-1');
const Cal1 = new C();
console.log(Cal1.add(2, 2));

//exports by this we get object containing properties.
/*const cal2 = require('./tes-module-2');
console.log(cal2.add(2, 2));*/
//using lates es6 method .
const { add, multiply, divide } = require('./tes-module-2');
console.log(add(5, 5));

//Caching (will load the module only once & other function are called from the caching ).
//calling the function righ-away while importing.
require('./test-module-3')();
require('./test-module-3')();
require('./test-module-3')();

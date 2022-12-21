module.exports = (fn) => {
  return (req, res, next) => {
    //if promise rejected then the errror is passed to next
    fn(req, res, next).catch(next);
  };
};
//^explanation 1
/*when we call this function we pass our express handler method in as a argument
 of a this anonymous function & the method simply return a another anonymous express
 method in which our actual handler method is then called and catch is being applied
 to it since it return a promise & in catch we provide error on next and thus 
 globalerroController gets called on.
//^explanation 2.
/*It takes our function(a) as an argument and returns express function which only
gets executed by express if the route is matched. then the returning express function
executes our function(a) and applies catch to it since it return promice & on catch we
send our error in the next() parameter.Hence the globalerroController gets called on.
//^NOTE: if we dont return (req, res, next) this another function from catchAsync then
//^ any route handler function acts as like a function call and automatically calls this 
//^method even if its not called by express. 
*/

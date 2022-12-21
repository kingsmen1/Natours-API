const fs = require('fs');
const http = require('http');
//url module help us to parse the url parameter and parse it's values  into formated objects .
const url = require('url');
//slugify is used to get the last part of the url and make some changes to it Ex:- converting to lowercase.
const slugify = require('slugify');
const replaceTemplate = require('../modules/replaceTemplate');

//Reading data only once the program starts where-as the request's can fire multiple times .
//its alway a better practice to user "__dirname" of specifying directory .
//const tempOverview = fs.readFileSync(`${__dirname}/starter/templates/template-overview.html`, 'utf-8');
const tempOverview = fs.readFileSync(
  './starter/templates/template-overview.html',
  'utf-8'
);
const tempCard = fs.readFileSync(`./starter/templates/template-card.html`, 'utf-8');
const tempProduct = fs.readFileSync('./starter/templates/template-product.html', 'utf-8');
//starter\templates\template-overview.html

const data = fs.readFileSync(`./dev-data/data.json`, 'utf-8');
//JSON.parse is used to take json data and convert into J.S object .
const productsData = JSON.parse(data);

//Slugifying
const slugs = productsData.map((el) => slugify(el.productName, { lower: true }));
//console.log(slugs);

//Creating server .
const server = http.createServer((req, res) => {
  console.log(req.url);
  ///product?id=2 = this is the url .

  const { query, pathname } = url.parse(req.url, true);
  //query is 'id=2' , where pathName is '/product'
  //const pathName = req.url;

  //Overview page .
  if (pathname == '/' || pathname == '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });
    //mapping the products data from data.json . el is the current element from the loop .
    //'.join' will convert it to string similar like '.toString()' in flutter.
    const cardsHtml = productsData.map((el) => replaceTemplate(tempCard, el)).join('');
    const output = tempOverview.replace(/{%PRODUCT_CARDS%}/g, cardsHtml);
    //console.log(cardsHtml);
    res.end(output);
  }

  //Product page .
  else if (pathname == '/product') {
    if (query.id == null) return res.end('please enter the id ');
    else {
      console.log(query);
      res.writeHead(200, {
        'Content-type': 'text/html',
      });
      const product = productsData[query.id];
      console.log(`${pathname} this is pathname`);
      console.log(`${product.productName} this is product`);
      console.log(`${tempProduct} this is tempProduct`);

      const output = replaceTemplate(tempProduct, product);
      console.log(`${output} this is output`);

      res.end(output);
    }
  } else if (pathname == '/api') {
    res.writeHead(200, {
      //application/json we tell brower to expect json data .
      'Content-type': 'application/json',
    });
    res.end(data);
  }

  //Not found .
  else {
    //showing error by responding 404 .
    res.writeHead(404, {
      //text/html we tell browser to expect html content .
      'Content-type': 'text/html',
      'my-own-header': 'hello-world',
    });
    res.end('<h1>Page not found</h1>');
  }
});

server.listen(4500, '127.0.0.1', () => {
  console.log('listening to request on port 4500');
});

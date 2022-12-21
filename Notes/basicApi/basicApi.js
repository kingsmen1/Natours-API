const fs = require('fs');
const http = require('http');
//url module help us to parse the url parameter and parse it's values  into formated objects . 
const url = require('url');

//Reading data only once the program starts where-as the request's can fire multiple times .
//its alway a better practive to user "__dirname" of specifying directory .
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
//JSON.parse is used to take json data and convert into J.S object .
const productsData = JSON.parse(data);


//Creating server .
const server = http.createServer((req, res) => {
    const pathName = req.url;
    if (pathName == '/' || pathName == '/overview') {
        res.end('Welcome to the OverView');
    } else if (pathName == "/products") {
        res.end('Welcome to products');
    } else if (pathName == '/api') {
        res.writeHead(200, {
            //application/json we tell brower to expect json data .
            'Content-type': 'application/json',
        });
        res.end(data);
    } else { //showing error by responding 404 .
        res.writeHead(404, {
            //text/html we tell browser to expect html content .
            'Content-type': 'text/html',
            'my-own-header': 'hello-world'
        });
        res.end('<h1>Page not found</h1>');
    }
});

server.listen(4500, '127.0.0.1', () => {
    console.log('listening to request on port 4500');
});
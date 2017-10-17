const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const js = fs.readFileSync(`${__dirname}/../hosted/bundle.js`);
const searchIcon = fs.readFileSync(`${__dirname}/../hosted/searchIcon.png`);
const logo = fs.readFileSync(`${__dirname}/../hosted/logo.png`);

const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const getCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

const getJS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/javascript' });
  response.write(js);
  response.end();
};

const getSearchIcon = (request, response) => {
  response.writeHead(200, {'Content-Type': 'image/png'});
  response.write(searchIcon);
  response.end();
}

const getLogo = (request, response) =>{
  response.writeHead(200, {'Content-Type':'image/png'});
  response.write(logo);
  response.end();
}

module.exports = {
  getIndex,
  getCSS,
  getJS,
  getSearchIcon,
  getLogo,
};

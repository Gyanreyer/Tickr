const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const js = fs.readFileSync(`${__dirname}/../hosted/bundle.js`);
const search = fs.readFileSync(`${__dirname}/../hosted/searchIcon.png`);
const refresh = fs.readFileSync(`${__dirname}/../hosted/refreshIcon.png`);

const emptyHeart = fs.readFileSync(`${__dirname}/../hosted/heartIcon-empty.png`);
const fullHeart = fs.readFileSync(`${__dirname}/../hosted/heartIcon-full.png`);

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
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(search);
  response.end();
};

const getRefreshIcon = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(refresh);
  response.end();
};

const getEmptyHeartIcon = (request, response) => {
  response.writeHead(200, {'Content-Type': 'image/png'});
  response.write(emptyHeart);
  response.end();
};

const getFullHeartIcon = (request, response) => {
  response.writeHead(200, {'Content-Type': 'image/png'});
  response.write(fullHeart);
  response.end();
};

module.exports = {
  getIndex,
  getCSS,
  getJS,
  getSearchIcon,
  getRefreshIcon,
  getEmptyHeartIcon,
  getFullHeartIcon,
};

//Handles things related to reading 
const csv = require('fast-csv');
const fs = require('fs');
const Fuse = require('fuse.js');

const crypto = require('crypto');

let companiesList = [];

let companySearch;
const searchOptions = {
    keys: [{
        name:'symbol',
        weight: 0.3
    },{
        name:'name',
        weight: 0.7,
    }],
    shouldSort: true,
    threshold: 0.05,
};

//Read csv file of stocks (courtesy of lists I downloaded and modified from NASDAQ website for NASDAQ, NYSE, AMEX, and all ETFs - http://www.nasdaq.com/screening/company-list.aspx)
//Only American market data is available because 'Murica or something (or I'm lazy and 8000+ stocks is more than enough)
const stream = fs.createReadStream(`${__dirname}/../resources/companylist.csv`);
const csvStream = csv().on(
    'data', data => companiesList.push({
        symbol:data[0],//Stock ticker symbol of company
        name:decodeURI(data[1]),//Name of company
    })).on(
        'end', ()=>companySearch = new Fuse(companiesList,searchOptions));//Set up Fuse object for searching companies list

stream.pipe(csvStream);

const searchCompanies = (request, response, searchString) => {

    const companies = companySearch.search(searchString).slice(0,25);

    response.writeHead(200, {'Content-Type':'application/json'});
    response.write(JSON.stringify({companies}));
    response.end();
};

module.exports = {
    searchCompanies,
};
require('dotenv').config();
const express = require('express')
const next = require('next')
const mongoist = require('mongoist')
const moment = require('moment');
const tagger = require('./tags/tagger.js');
const dev = process.env.NODE_ENV !== 'production'
const app = next({
  dev, 
  quiet: false
})

const handle = app.getRequestHandler()
const fs = require('fs');

var db_connection = process.env.DB_CONNECTION;

if(!db_connection)
{
  console.log('no db connection!');
  return -1;
}

const db = mongoist(db_connection, {
  useNewUrlParser: true
});


function editResults(result){
  for (var i = 0; i < result.length; i++){

    var item = result[i];
    // date ago
    item.timeCreatedAgo = moment(item.dateCreated).fromNow();
    
    if (item.saleType == 1)
    {
      item.contentTags.push('$ for sale');
    }
    else if (item.saleType == 3)
    {
      item.contentTags.push('$ sold');
    }
    else 
      item.contentTags.push('$ no price');

    
    if(!result[i].title){
      result[i].title = result[i].description.slice(0,50);
    }
    
    
    if (
      (!item.url || item.url == "" || !item.url.indexOf(item.urlSource)>-1) &&
      (item.title && item.title.search(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}$/i) > -1)
    )
    {
      item.url = "http://" + item.title;
    }
    
    if(!item.url)
     continue;
     
    //console.log("url for stat: " + item.url);
    
    //prepare stats urls
    if (item.url.match(/play\.google\.com/i))
    {
      //console.log("google play detected");
      
      // like this: https://play.google.com/store/apps/details?id=com.apps.ash.profilepicscore&hl=en
      // similar web is like this: https://www.similarweb.com/app/google-play/com.apps.ash.profilepicscor/statistics
      var matches = item.url.match(/details\?id\=([a-z\.]+)[$&]?/i);
      if (matches && matches.length>0)
      {
        // link to similar web to view google play stat
        item.urlStat = "https://www.similarweb.com/app/google-play/" + matches[1] + "/statistics";
      }
    }
    else if (item.url.match(/itunes\.apple\.com/i))
    {
      // apple links: https://itunes.apple.com/us/app/nail-designs-create-beautiful-manicures-art/id492114299?mt=8
      // https://itunes.apple.com/us/app/id1122649984 
      
      // console.log("apple app store detected");
      
      // like this: https://play.google.com/store/apps/details?id=com.apps.ash.profilepicscore&hl=en
      // similar web is like this: https://www.similarweb.com/app/google-play/com.apps.ash.profilepicscor/statistics
      
      var matches = item.url.match(/id(\d+)[$&\?]/i);
      if (matches && matches.length>0)
      {
        // link to similar web to view google play stat
        item.urlStat = "https://www.similarweb.com/app/app-store/" + matches[1] + "/statistics";
      }
    }    
    else if (item.url.indexOf(item.siteUrl) ==-1)
    {
      // website
      item.urlStat = "https://www.similarweb.com/website/" + item.url.replace(/https?:\/\//ig,"");
    }
    
/*
    if (!result[i].url || result[i].url.length == 0){
      result[i].url = result[i].siteUrl;
    }
    
    // extract shorted domain name from item.url
    result[i].urlShort = result[i].url;
    
    var matches = result[i].url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i)[1]
    // saving it as item.urlShort
    if (matches && matches.length>0){
      result[i].urlShort = matches[1].replace('www.','');
    }
*/

  }
  return result;
}

// returns object { filterTags, daysAgo};
function getFilterInfo(resultFilter)
{
// filter pricing tags

  resultFilter = decodeURIComponent(resultFilter.replace(/\+\+/g,"+"));
  var filterArray = resultFilter.split('+');
  
  // find max price filtering
  var maxPrice = -1;
  var saleType = 0; // 0 = not for sale or no filter, 1 = for sale, 2 = pending, 3 = sold
  if( resultFilter.indexOf("$ sold") > -1)
    saleType = 3;
  else if (resultFilter.indexOf("$ for sale") > -1)
    saleType = 1;
  
  //console.log('filterarray:' + JSON.stringify(filterArray));

  filterArray.forEach(function(item) {
      if (item.indexOf('$')>-1) { 
        var ind = tagger.allPriceTags.indexOf(item);
        // regular price
        if (ind > -1){
          var v = tagger.allPriceTagsValues[ind];
          if (v > maxPrice)
            maxPrice = v;
        }
      }
  });
  
  debugger;
  
  if (maxPrice == -1) 
    maxPrice = Number.MAX_SAFE_INTEGER;
    
  // find days ago from tags
  var daysAgo = 0;
  filterArray.forEach(function(item) {
      if (item.indexOf(':')>-1) { 
        var ind = tagger.allDayTags.indexOf(item);
        if (ind > -1){
          var v = tagger.allDayTagsValues[ind];
          if (v > daysAgo)
            daysAgo = v;
        }
      }
  });
  
  var contentTagsArray = filterArray.filter(item => (item.indexOf('$') == -1 && item.indexOf(':') == -1));

  var output = {};
  var outputFilters = {};

  var filterTags = {};

  if (contentTagsArray.length > 0){
    
    filterTags = {
          // include for ALL given topics with AND logic
          $in: contentTagsArray
        };

    outputFilters.contentTags = filterTags;
  }
  
  if (daysAgo > 0)
  {
    var dateEnd = new Date();
    var dateEndString = dateEnd.toISOString();
    var dateStartString = new Date(dateEnd - daysAgo * 1000 * 60 * 60 * 24).toISOString();
  
    var dateCreated = {
              $gte: dateStartString,
              $lt: dateEndString
          };
    
    outputFilters.dateCreated = dateCreated;
  }
  
  if (maxPrice >= 0)
  {
    var price = {};
    
    if (maxPrice == 0)
      price = {
                $eq: 0,
            };
    else 
      price = {
                $gte: 0,
                $lt: maxPrice
            };
    
    outputFilters.price = price;
  }  
  
  if(saleType > 0) // 0 = not for sale, 1 = for sale, 2 = pending, 3 = sold
  {
      outputFilters.saleType = {
                $eq: saleType
            };
  }
    
  
  // FINALLY assign main filters
  output.filters = outputFilters;
  

  // assign sorting (.sorting)
  
  if (maxPrice > 0)
  {
    output.sorting = {price: -1, dateCreated: -1};
  }
  else {
    output.sorting = {dateCreated: -1, price: -1};
  }
  
  //console.log('filterInfo: ' + JSON.stringify(output));  
  
  return output;
}

// redirect to ssl if we are not ssl
function redirectToSecure(res,req)
{
  if(req.headers["x-forwarded-proto"] === "https"){
        // OK, continue
        return false;
  }
  
  res.redirect('https://'+req.hostname+req.url);
  return true;
}

// main block
app.prepare()
  .then(() => {
    const server = express()

    // output basic favicon
    const favicon = new Buffer('AAABAAEAEBAAAAEAGABoAwAAFgAAACgAAAAQAAAAIAAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9fX339/f////////////////////////////////////////////////39/d8fHz4+Pj////////////////////////////////////////////////////////4+Pj////////////////////////////////////////////////////////////////////////////////w8P+2tv/////////////////IyP/k5P/////////////////////////////////8/P9jY//w8P/////////+/v9sbP/t7f////////////////////////////////////+Tk/+kpP/Nzf/Nzf+/v/93d//////////////////////////////////////////IyP9ubv+9vf+9vf+EhP+pqf/////////////////////////////////////////39/9hYf/4+P////97e//c3P////////////////////////////////////////////+Jif/Ly//y8v9nZ//+/v////////////////////////////////////////////+9vf+YmP/Cwv+Xl//////////////////////////////////////////////////w8P9nZ/+Rkf/Jyf////////////////////////////////////////////////////99ff9dXf/39//////////////////////////////////////////////////////s7P/j4//////////////////////////////////////////////////////////////////////////////////////////////39/f////////////////////////////////////////////////////////39/d9fX339/f////////////////////////////////////////////////39/d8fHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'base64'); 
     server.get("/favicon.ico", function(req, res) {
      if (redirectToSecure(res,req)) return;
      res.statusCode = 200;
      res.setHeader('Content-Length', favicon.length);
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader("Cache-Control", "public, max-age=2592000");                // expiers after a month
      res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
      res.end(favicon);
     });

    server.get('/alltags', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      var result = await db.items.distinct("contentTags");
      
      // adding all days ago tags
      tagger.allDayTags.forEach(function(item){ result.push(item) });
      result.push("$ sold");
      result.push("$ for sale");
      result.push("$ no price");
      
      result.sort();
      res.json(result);
    });
    
    server.get('/tags', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      res.redirect('/');      
    });
    
    server.get('/id', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      res.redirect('/');      
    });
    
    
    server.get('/count', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      var i = 0;
      var result = null;
      
      // if we have to display just one item
      var matches = req.url.match(/id=([0-9a-z]+)/i);
      if (matches && matches.length > 0){
        result = 1;
        return res.json(result);
      }
      
      i = req.url.indexOf('filter=');
      var resultFilter = null;
      if (i>-1) { 
        resultFilter = req.url.substr(i+7); // cutting from filter= instead of using req.query.filter;
      }

      if(resultFilter == null || typeof resultFilter === 'undefined' || resultFilter === 'undefined' || resultFilter === 'null'){
          result = await db.items.count();
      } else{
          var filters = getFilterInfo(resultFilter);
          result = await db.items.count(filters.filters);
      }
        res.json(result);
    });
    
    server.get('/data', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      
      var result = null;
      
      // check if we have like ?item=itemid
      //console.log("url:" + req.url );
      var itemId = null;      
      var matches = req.url.match(/id=([0-9a-z]+)/i);

      if (matches && matches.length > 0) { 
        itemId = matches[1]; // cutting from filter= instead of using req.query.filter;
        //console.log('item hash found = ' + itemId)
      }
      
      if (itemId && itemId.length>3){
        
        var foundItem = await db.items.findOne({
              hash: itemId
          });

        if(foundItem){
          // if found then create array
          result = [foundItem ];
        }
        //console.log('item found by hash:' + JSON.stringify(result));
      }
      
      // if no result yet (item not found)
      if (!result || result.length == 0) 
      {
        var resultCurrentSize = parseInt(req.query.size);
        
        var i = req.url.indexOf('filter=');
        var resultFilter = null;
        
        if (i>-1) { 
          resultFilter = req.url.substr(i+7); // cutting from filter= instead of using req.query.filter;
        }
        
        var resultNextCount = parseInt(req.query.next);
  
        if(resultFilter == null || typeof resultFilter === 'undefined' || resultFilter === 'undefined' || resultFilter === 'null' || (resultFilter == "")){
          result = await db.items.findAsCursor().sort({dateCreated: -1}).skip(resultCurrentSize).limit(resultNextCount).toArray();
        } else{
          var filters = getFilterInfo(resultFilter);   
          result = await db.items.findAsCursor(filters.filters).sort(filters.sorting).skip(resultCurrentSize).limit(resultNextCount).toArray();
        }
        
      }
      // return
      res.json(editResults(result));
    });

    server.get('/tags/:filter', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      app.render(req, res, "/", {})
    });
    
    server.get('/id/:id', async function(req, res) {
      if (redirectToSecure(res,req)) return;
      app.render(req, res, "/", {})
    });


    server.get('*', (req, res) => {
      if (redirectToSecure(res,req)) return;
      return handle(req, res)
    })

    server.listen(process.env.PORT || 5000, (err) => {
      if (err) throw err
      console.log('>>>> Ready')
    })
    
  })
  .catch((ex) => {
    console.error(ex.stack)
    process.exit(1)
  })

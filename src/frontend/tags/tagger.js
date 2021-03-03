'use strict';

const path = require("path");
const fs = require('fs');
const tagsDictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, "tags.json")), 'utf8');


// from tagger.js
const PRICE_ZERO_TAG = "$ no price";
const PRICE_1K_TAG = "under $1k";
const PRICE_5K_TAG = "under $5k";
const PRICE_10K_TAG = "under $10k";
const PRICE_25K_TAG = "under $25k";
const PRICE_50K_TAG = "under $50k";
const PRICE_100K_TAG = "under $100k";
const PRICE_250K_TAG = "under $250k";
const PRICE_500K_TAG = "under $500k";
const PRICE_1M_TAG = "under $1M";
const PRICE_10M_TAG = "under $10M";
const PRICE_100M_TAG = "under $100M";
const PRICE_500M_TAG = "under $500M";

const ADDED_TODAY = "added: today";
const ADDED_3_DAYS_AGO = "added: 3 days";    
const ADDED_7_DAYS_AGO = "added: 7 days";  
const ADDED_30_DAYS_AGO = "added: 30 days";


module.exports = {
  // for some reason if i defined tag for "$ sold" (like "const PRICE_SOLD = "$ sold") it is not working! so hardcoding the string every time
  allPriceTags: [PRICE_ZERO_TAG, PRICE_1K_TAG,PRICE_5K_TAG,PRICE_10K_TAG,PRICE_25K_TAG,PRICE_50K_TAG,PRICE_100K_TAG,PRICE_250K_TAG,PRICE_500K_TAG,PRICE_1M_TAG,PRICE_10M_TAG,PRICE_100M_TAG,PRICE_500M_TAG],
  allPriceTagsValues: [0, 1000, 5000,10000,25000,50000,100000,250000,500000,1000000,10000000,100000000,500000000],
  allDayTags: [ADDED_TODAY, ADDED_3_DAYS_AGO, ADDED_7_DAYS_AGO, ADDED_30_DAYS_AGO],
  allDayTagsValues: [1, 3, 7, 30],

  removeDuplicatesFromArray: function(a) {
      return a.sort().filter(function(item, pos, ary) {
          return !pos || item != ary[pos - 1];
      })
  },


  removeFromArray: function(array, element) {
      return array.filter(e => e !== element);
  },
  
  parsePriceFromString: function(price){
    
    var priceNum = 0;
    var multiplicator = 1;
    
    // TODO: need to fix prices like 7.500 or 7.500.200 by checking for thousands separted by . instead of ,
    //price = price.replace('$7.500 OR WORTHY TRADE')
    
    // extract from string like "2000$ or less" or "1000 USD or less", "20k or more"
    var matches = price.match(/^([\$|\£|\€|\d\,\.\m\k]+)(\$|\£|\€|\s*EURO|\s*EUR|\s*USD|\s*dollars)+/i,"");
    if (matches && matches.length > 1)
      price = matches[2];
    
    price = price.replace(/.*[\$\£\€]+/,""); // to turn "15ETH OR $5000" into "5000"
    
    price = price.replace(/^[\D]*/ig,""); // removing trailing non digits like "RS. 10000.23" to "10000.23"
    
     if( price.search(/[\d\s]+M(\s|$)+/i) > -1 || price.search((/[\d\s]+Million(\s|$)+/i)) > -1)
      multiplicator = 1000000; // million
    else if( price.search(/[\d\s]+K(\s|$)+/i) > -1)
      multiplicator = 1000; // thousands

    // extract from string like: $15,000 Time Remain: days left Detailed Category:
    matches = price.match(/[\d\.\, ]+/g);
    if (matches && matches.length > 0)
      price = matches[0];

    price = price.replace(/\,/g,"");
    price = price.replace(/\s/g,"");
    price = price.replace(/[^0-9\.]/g,"");
    
   if(price.length > 0)
   { 
     if (price.search(/\./)> -1)
        priceNum = parseFloat(price);
     else 
        priceNum = parseInt(price);
        
      priceNum = priceNum * multiplicator;
      
      return priceNum;
   }
    else 
      return 0; // no information about price    
    
  },
  
  isSold: function(item){
    
    const SoldTagsDetector = [
      "<span class=\"product__state product__state-sold\">Sold</span>", // transferslot
      "<span class=\"sold\">SOLD</span>", // borderline.biz
      "<span class=\"asking-price-sold\">SOLD</span>", // feinternational
      "margin-bottom-5px\">\\s+SOLD" // sideprojectors
      ]
    
    var isSold = false;
    
    if (item.descriptionRaw){ 
      isSold = SoldTagsDetector.find(function(pattern){
        var re = new RegExp(pattern, "i");
        return (item.descriptionRaw.search(re) > -1);
      });
    }    
    
    return isSold;
  },
  
  addTagsFromClean: function(item)
  {
    return this.addTagsExecute(item, true);
  },
  
  addTags: function(item)
  {
    return this.addTagsExecute(item, false);
  },
  
  addTagsExecute: function(item, fromClean) {
    var newContentTags = item.contentTags;
    
    newContentTags = this.removeDuplicatesFromArray(newContentTags);

    var preserveTags = {};
    
    if (fromClean){
      // tags coming from parser or from old items
      preserveTags = "$ for sale,startup,amazon,web,ios,android,ecommerce,game,app,$ sold".split(',');
      // filter existing tags
      newContentTags = newContentTags.filter(item => preserveTags.indexOf(item) > -1);     
    }

    for (var key in tagsDictionary) {
      // checking for this tag
      
      // skip this tag if we already have this tag added
      if(newContentTags.includes(key))
        continue;
      
      var values = tagsDictionary[key].toString();

      var words = values.split(",");
      // now check everykeyword for this tag
      for (var i = 0; i < words.length; i++) {
        
        // clean from leading trailing spaces
        var wordCheck = words[i].trim();
        
        var re = new RegExp("(^|\\s)+" + wordCheck + "(\\s|$)+", 'gi');
        
        // check title and description
        if (
              (item.description && item.description.search(re) > -1) ||
              (item.title && item.title.search(re) > -1)
          ) 
        {
            console.log('new tag added:' + key);
            newContentTags.push(key);
            break; // go to next tag as we are done with this one and found at least one single keyword for it
        }
      }
      
    } // tag dictionary
    

    // check if we need to fix pricing
    // fixing Flippa price which can be set in the description like this: `Buy It Now: $334,343.12`
    if (item.categoryTags.includes("flippa") || item.categoryTags.includes("transferslot"))
    {
      
        //if(item.title.indexOf("Your productivity assistant") > -1 || item.title.indexOf("Recordit") > -1)
        //  debugger;
        //if(item.title.indexOf('Codestunts') > -1)
        // debugger;
          
        console.log('fixing FLIPPA or TRANSFERSLOT pricing - trying to extract Buy It Now price from description');
        
        // flippa
        var matches = item.descriptionRaw.match(/Buy It Now:\s*([\$\d\,\.]+)/i);
        
        // transferslot 
        if (!matches || matches.length == 0) 
          matches = item.descriptionRaw.match(/metric-price\"\>\s*([\$\d\,\.]+)/i);
        
        if (matches && matches.length > 1)
        {
          console.log('new price found: ' + matches[1]);
          var newPrice = this.parsePriceFromString(matches[1]);
          console.log('new price parsed = ' + newPrice);
          if (newPrice && newPrice > 0){
            console.log('new price: ' + newPrice + " for " + item.title);
            item.price = newPrice;
          }
        }
         else {
           console.log("in description price not found, descriptionRaw: " + item.descriptionRaw);
         }
    }    
    
    
    // now tag based on prices
    if (item.price == 0){
      if (!newContentTags.includes(PRICE_ZERO_TAG))
        newContentTags.push(PRICE_ZERO_TAG);
    }
    else if (item.price < 1000){
      if (!newContentTags.includes(PRICE_1K_TAG))
        newContentTags.push(PRICE_1K_TAG);
    }
    else if (item.price < 5000){
      if (!newContentTags.includes(PRICE_5K_TAG))
        newContentTags.push(PRICE_5K_TAG);
    }
    else if (item.price < 10000){
      if (!newContentTags.includes(PRICE_10K_TAG))
        newContentTags.push(PRICE_10K_TAG);
    }
    else if (item.price < 25000){
      if (!newContentTags.includes(PRICE_25K_TAG))
        newContentTags.push(PRICE_25K_TAG);
    }
    else if (item.price < 50000){
      if(newContentTags.includes(PRICE_50K_TAG)) 
        newContentTags.push(PRICE_50K_TAG);
    }
    else if (item.price < 100000){
      if (!newContentTags.includes(PRICE_100K_TAG))
        newContentTags.push(PRICE_100K_TAG);
    }
    else if (item.price < 250000){
      if(!newContentTags.includes(PRICE_250K_TAG))
        newContentTags.push(PRICE_250K_TAG);
    }
    else if (item.price < 500000){
      if(!newContentTags.includes(PRICE_500K_TAG))
        newContentTags.push(PRICE_500K_TAG);
    }
    else if (item.price < 1000000){
      if(!newContentTags.includes(PRICE_1M_TAG))
        newContentTags.push(PRICE_1M_TAG);
    }
    else if (item.price < 10000000){
      if(!newContentTags.includes(PRICE_10M_TAG))
        newContentTags.push(PRICE_10M_TAG);
    } 
    else if (item.price < 100000000){
      if(!newContentTags.includes(PRICE_100M_TAG))
        newContentTags.push(PRICE_100M_TAG);
    } 
    else if (item.price < 500000000){
      if(!newContentTags.includes(PRICE_500M_TAG))
        newContentTags.push(PRICE_500M_TAG);
    }
    
    // check if project is sold
    var isSold = this.isSold(item);
    if (isSold){
      item.saleType = 3; // sold
    } 
    else {
      var jj = item.contentTags.indexOf("$ for sale");
      if (jj > -1 || item.price > 0){

        item.saleType = 1; // for sale
      }
      else 
        item.saleType = 0; // not for sale
    }
    
    // removing tags as we have .saleType    
    var ii = newContentTags.indexOf("$ for sale");
    debugger;
    if (ii > -1){
      // remove "$ for sale" tag as we have .saleType now
      newContentTags.splice(ii,1);
    }

    ii = newContentTags.indexOf("$ sold");
    if (ii > -1){
      // remove "$ sold" tag as we have .saleType now
      newContentTags.splice(ii,1);
    }             

    ii = newContentTags.indexOf("$ no price");
    if (ii > -1){
      // remove "$ no price" tag as we have .saleType now
      newContentTags.splice(ii,1);
    }             
    
    // fixing ycombinator urls
    if (item.url && item.url.indexOf('://')==-1 && item.urlSource.indexOf('ycombinator')>-1)
    {
      item.url = "https://news.ycombinator.com/" + item.url;
      console.log('ycombinator .url fixed to ' + item.url);
    }
    
    item.contentTags = newContentTags;
    
    return item; // modified item
  }
};
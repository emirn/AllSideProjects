'use strict';
require('dotenv').config()
const retry = require('async-retry')
const fetch = require('node-fetch')
const MD5 = require("crypto-js/md5");
const mongoist = require('mongoist');
const fs = require('fs');
const tagger = require('./tags/tagger.js');

var db_connection = process.env.DB_CONNECTION;
if(!db_connection)
{
  console.log('no db connection!');
  return -1;
}

const db = mongoist(db_connection, {
  useNewUrlParser: true
});

async function main() {
  
  console.log('re-tagging started')
  
  const items = await db.items.find();
  debugger;
  
  for (var i = 0; i < items.length; i++) {
    
      console.log('retagging item #' + i);
      console.log("price (unparsed): " + items[i].price);      
      

      console.log(items[i].title + ', old content tags:' + items[i].contentTags);      
      
      var newItem = tagger.addTagsFromClean(items[i]); // clean and add new tags
        
      console.log(newItem.title + ', new content tags:' + newItem.contentTags);
      console.log(newItem.title + ', price:' + newItem.price);
      
      var itemHash = MD5(newItem.sourceUrl + newItem.url + newItem.title).toString();

      await db.items.update({ _id : items[i]._id },{ $set: { 
        hash: itemHash, 
        contentTags: newItem.contentTags, 
        saleType: newItem.saleType,
        price: newItem.price, 
        url: newItem.url }});
      
      console.log(i + ' updated in the db');
  }

  db.close();
  console.log('re-tagging finished');
};

main();



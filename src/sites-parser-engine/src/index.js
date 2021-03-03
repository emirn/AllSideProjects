  'use strict';
//provide last version chromium headless shell to aws lambda packed with serverless. Path for chrome is /tmp/headless_shell
const getChromePath = require('@browserless/aws-lambda-chrome')({
  path: '/tmp'
})
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const libxmljs = require('libxmljs');
const htmlclean = require('htmlclean');
const mandatoryProperties = ["siteUrl", "siteName", "categoryTags", "contentTags", "title", "url", "urlSource", "descriptionRaw", "description", "dataCreated"];
const optionalProperties = ["price"];
const answerHeader = {
      "Access-Control-Allow-Origin": "*",
      'accept': 'application/json',
      'accept-language': 'en_US',
      'content-type': 'raw'
    };

module.exports.handler = async (event) => {
  try{
  var config;
  if(event.lambda === "true"){
    config = event.body;
  }
  else{
    config = JSON.parse(event.body);
  }
  var errResp = await validateConfig(config);
  if (errResp) {
    return errResp;
  }
  const headless_shell = await getChromePath();

  const {
    stdout
  } = await exec(headless_shell + ' --headless --disable-gpu --timeout=15000 --dump-dom --no-sandbox --single-process --no-zygote  --disable-dev-shm-usage  --virtual-time-budget=15000 ' + config.siteUrlToParse, {
    maxBuffer: 1024 * 6000
  });
  var contentToParse = htmlclean(stdout);
  contentToParse = contentToParse.replace(/\n|\r|\t|&nbsp;/g, "");
  //console.log("contentToParse " + contentToParse);
  var beginIndexOfOccurence = nthIndex(contentToParse, config.beginStringForHtmlDiv, parseInt(config.occurenceOfBeginString));
  var matchEndStringRegexp = new RegExp(config.endStringForHtmlDiv, "gi")
  var endIndexOfOccurence = nthIndex(contentToParse, config.endStringForHtmlDiv, parseInt((contentToParse.match(matchEndStringRegexp) || []).length - config.occurenceOfEndString + 1));
  var content = contentToParse.substring(beginIndexOfOccurence, endIndexOfOccurence + config.endStringForHtmlDiv.length);

  var contentDom = libxmljs.parseHtmlFragment(content, {
    recover: true,
    noent: true,
    noblanks: true,
    nocdat: true
  });
  var items = [];
  var contentValues;
  var descriptionRaws = contentDom.find(config.descriptionRawXPath);
  for (var i = 0; i < descriptionRaws.length; i++) {
    items.push({
      'descriptionRaw': descriptionRaws[i].toString()
    });
  }
  for (var i = 0; i < items.length; i++) {
    var localContent = libxmljs.parseHtmlFragment(items[i].descriptionRaw, {
      recover: true,
      noent: true,
      noblanks: true,
      nocdat: true
    });
    for (var j = 0; j < config.properties.length; j++) {
      if (mandatoryProperties.indexOf(config.properties[j].property) > -1 || optionalProperties.indexOf(config.properties[j].property) > -1) {
        contentValues = fetchContentValues(config.properties[j], localContent);
        if (contentValues.length > 0) {
          items[i][config.properties[j].property] = contentValues[0];
        } else {
          items[i][config.properties[j].property] = "";
        }
      }
    }
    for (var j = 0; j < config.properties.length; j++) {
      if (mandatoryProperties.indexOf(config.properties[j].property) < 0 &&
        optionalProperties.indexOf(config.properties[j].property) < 0 &&
        config.properties[j].addToDescription === "true") {
        contentValues = fetchContentValues(config.properties[j], localContent);
        if (contentValues.length > 0) {
          if (items[i]["description"]) {
            items[i]["description"] = items[i]["description"].concat(contentValues[0]);
          } else {
            items[i]["description"] = contentValues[0];
          }
        }
      }
    }
  }
  if(config.skipEmptyItem === "true"){
    items = items.filter(item => (item.description !== "" || item.url !== "" || item.title !== ""))
  }
  for (var j = 0; j < items.length; j++) {
    items[j]["siteUrl"] = config.siteUrl;
    items[j]["siteName"] = config.siteName;
    items[j]["categoryTags"] = config.categoryTags;
    items[j]["contentTags"] = config.contentTags;
    items[j]["dateCreated"] = new Date().toISOString();  // items[j]["dateCreated"] = new Date().toLocaleString();
    items[j]["urlSource"] = config.siteUrlToParse;
  }
if(config.debug === "true"){
  const res = {
    statusCode: 200,
    headers: answerHeader,
    body: JSON.stringify({
      items: items,
      html: content
    }),
  };
  return res;
} else{
  const res = {
    statusCode: 200,
    headers: answerHeader,
    body: JSON.stringify({
      items: items
    }),
  };
  return res;
}
}
catch(err){
  console.log(err);
  return errRespose(err.message);
}
};

function editValue(property, tempvalue) {
  if (property.insertbefore) {
    tempvalue = property.insertbefore + tempvalue;
  }
  if (property.insertafter) {
    tempvalue = tempvalue + property.insertafter;
  }
  if (property.regex) {
    var result = tempvalue.match(new RegExp(property.regex, 'gi'));
    if (result) {
      tempvalue = "";
      for (var i = 0; i < result.length; i++){
      tempvalue = tempvalue + result[i];
    }
    } else {
      tempvalue = "";
    }
  }
  if(property.cleantags === "true"){
    tempvalue = htmlclean(tempvalue.replace(/<\/?[^>]+(>|$)/g, " "));
  }
  if(property.replacements){
    var replacements = property.replacements;
    for(var i = 0 ; i < replacements.length; i++){
      tempvalue = tempvalue.replace(new RegExp(replacements[i].find, "g"), replacements[i].replace);
    }
  }
  return tempvalue;
}

function nthIndex(str, path, n) {
  var L = str.length,
    i = -1;
  while (n-- && i++ < L) {
    i = str.indexOf(path, i);
    if (i < 0) break;
  }
  return i;
}

function fetchContentValues(property, contentDom) {
  var contentValues = [];
  var contents = contentDom.find(property.xpath);
  if (property.valuetype === 'attr') {
    for (var j = 0; j < contents.length; j++) {
      var tempvalue = contents[j].value();
      contentValues.push(editValue(property, tempvalue));
    }
  }
    else if(property.valuetype === 'attrurl'){
      for (var j = 0; j < contents.length; j++) {
        var tempvalue = contents[j].value();
        if(tempvalue.includes('http://') || tempvalue.includes('https://')){
          contentValues.push(tempvalue);
        }
        else{
          contentValues.push(editValue(property, tempvalue));
        }

      }
    }
   else if (property.valuetype === 'raw') {
    for (var j = 0; j < contents.length; j++) {
      var tempvalue = contents[j].toString();
      contentValues.push(editValue(property, tempvalue));
    }
  } else if (property.valuetype === 'text') {
    for (var j = 0; j < contents.length; j++) {
      var tempvalue = contents[j].text().replace(/\\'/g, "'");
      contentValues.push(editValue(property, tempvalue));
    }
  }
  return contentValues;
}
async function validateConfig(config) {
  if(config === null){
    return errRespose("Empty config - query should be POST with config attached.");
  }
  if (config.descriptionRawXPath === null) {
    return errRespose("descriptionRawXPath is not presented in config");
  }
  for (var i = 0; i < config.properties.length; i++) {
    if (!config.properties[i].addToDescription) {
      if (mandatoryProperties.indexOf(config.properties[i].property) < 0 && optionalProperties.indexOf(config.properties[i].property) < 0) {
        return errRespose("Config element " + config.properties[i].property + " formed not properly: add boolean addToDescription to field above, or change to mandatory/optional attribute(title, url, price, descriptionRaw, description)");
      }
    }
  }
}

function errRespose(message) {
  const errResp = {
    statusCode: 200,
    headers: answerHeader,
    body: message
  };
  return errResp;
}

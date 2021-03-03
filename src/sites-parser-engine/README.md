# testing on lambda (using built-in test button in UI)

to run lambda you need to put the following JSON as input for testing event


```
{"lambda":"true",
  "body": {
    
    CONFIG_GOES_HERE
    
  }
}
```

# prepare zip for lambda

cd src
zip -r ../sites-parser-engine.zip *

# sites-parser-engine
sites parsing engine


For scripting deploying chromeless parsing engines on lambda next actions needed:
1. git clone https://github.com/ae38/sites-parser-engine.git && cd sites-parser-engine
2. Edit serverless.yaml for values: 
  region: #your region
  
    deploymentBucket:
    name: #your deployment backet
3. Assure, that AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY is presented in your command line session(can be checked https://stackoverflow.com/questions/21440709/how-do-i-get-aws-access-key-id-for-amazon). Also Node version should be 8.10, npm should be presented.
4. Run script: npm init -y && npm install serverless -g && npm install libxmljs && npm install htmlclean && npm install @browserless/aws-lambda-chrome --save && serverless deploy

For manual deploying chromeless parsing engines on lambda next actions needed:
1. git clone https://github.com/ae38/sites-parser-engine.git 

   cd sites-parser-engine

   Node version should be 8.10, npm should be presented.
   
2. npm init 
 
      all modules installed will be uploaded to AWS   

3. npm install serverless -g

4. npm install @browserless/aws-lambda-chrome --save

5. npm install libxmljs

6. npm install htmlclean

7. Edit serverless.yaml For values: 
  runtime: nodejs8.10
  region: #your region
  
    deploymentBucket:
    name: #your deployment backet

8. Assure, that AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY is presented.

9. serverless deploy

      Check console output that .zip file should be 30 - 60 MB. If less - remove node_modules and start from step 2.
10. Check next messages on console  endpoints (should look like:
  POST - https://XXXXXXXXXXXX.execute-api.us-east-1.amazonaws.com/dev/content
)

11. In case of checking logs use: serverless logs -f parsingEngine --startTime 10m

12. Postman could be used for creating/checking new json rules for parsing (POST query to ASW endpoint, raw json content)

13. Please be advised that queries shoud be separated in time (10 - 15 sec for each), because on AWS Lambda headless chrome process works for each query separately. Sometimes headless can be unavailable due to slow process exiting of previous query. Just try again in 30s-1m time.

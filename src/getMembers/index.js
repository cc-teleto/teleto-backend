let AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "us-east-2"
});

exports.handler = async (event) => {
    let result = "";
    let response = {
        statusCode: 200,
        body: "",
    };;
    let params = {
        TableName : 'Teleto-members',
        ExpressionAttributeNames:{'#x': 'grouphash'},
        ExpressionAttributeValues:{':y': event.queryStringParameters['grouphash']},
        KeyConditionExpression: '#x = :y'
    };
    let resultJSON = await documentClient.query(params).promise();
    
    if(event.queryStringParameters !== null){
        if (event.queryStringParameters['random'] === "true") {

            let random = Math.floor( Math.random() * resultJSON.Count );
            let resultMember = [resultJSON.Items[random]];
            response.body = JSON.stringify(resultMember[0].membername);
        } else {
            result = resultJSON.Items;
            response.body = JSON.stringify(result);
        }
    } else {
        result = resultJSON.Items;
        response.body = JSON.stringify(result);
    }
    
    return response;
};
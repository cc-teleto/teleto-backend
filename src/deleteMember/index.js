let AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({
    region: "us-east-2"
});


exports.handler = async(event) => {
    let response = {
        statusCode: 200,
        body: "",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE"
        }
    };
    try {
        let result = "";
        let params = {
            TableName: 'Teleto-members',
            Key:{
                grouphash: event.queryStringParameters['grouphash'],
                memberhash: event.queryStringParameters['memberhash']
            }
        };
        console.log(params)
        let resultJSON = await documentClient.delete(params).promise();

        response.body = JSON.stringify({memberhash: event.queryStringParameters['memberhash']});
        return response;

    }
    catch (e) {
        response.statusCode = 402;
        response.body = "Error: request schema is invalid."
        console.log(e);
        return response;
    }

};
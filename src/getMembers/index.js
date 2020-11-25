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
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        let result = "";
        let params = {
            TableName: 'Teleto-members',
            ExpressionAttributeNames: { '#x': 'grouphash' },
            ExpressionAttributeValues: { ':y': event.queryStringParameters['grouphash'] },
            KeyConditionExpression: '#x = :y'
        };
        let resultJSON = await documentClient.query(params).promise();

        if (event.queryStringParameters !== null) {
            if (event.queryStringParameters['random'] === "true") {

                let random = Math.floor(Math.random() * resultJSON.Count);
                let resultMember = [resultJSON.Items[random]];
                response.body = JSON.stringify({ "value": resultMember[0].membername });
            }
            else {
                result = resultJSON.Items;
                response.body = JSON.stringify({"members": result});
            }
        }
        else {
            result = resultJSON.Items;
            response.body = JSON.stringify(result);
        }

        return response;

    }
    catch (e) {
        response.statusCode = 402;
        response.body = "Error: request schema is invalid."
        console.log(e);
        return response;
    }

};
const crypto = require("crypto");
let AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: "us-east-2"
});

exports.handler = async (event) => {
    const response = {
        statusCode: 201,
        body: "",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
    };

    let sha512 = crypto.createHash('sha512');

    let current_date = (new Date()).valueOf().toString() + Math.random();
    sha512.update(current_date);
    let grouphash = crypto.createHash('sha512').update(current_date).digest('hex');

    for (let i = 0; i < event.body.members.length; i++){
        current_date = (new Date()).valueOf().toString() + Math.random();
        sha512.update(current_date);
        let memberhash = crypto.createHash('sha512').update(current_date).digest('hex');

        let params = {
            TableName : 'Teleto-members',
            Item: {
                "grouphash": grouphash,
                "memberhash": memberhash,
                "membername": event.body.members[i]
            }
        };
        await documentClient.put(params).promise();
    }
    
    response.body = {
        "grouphash": grouphash
    };
    return response;
};

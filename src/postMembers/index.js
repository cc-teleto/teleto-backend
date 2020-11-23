const crypto = require("crypto");
let AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({
    region: "us-east-2"
});


exports.handler = async(event) => {
    const response = {
        statusCode: 201,
        body: "",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
    };

    let memberArray;
    try {
        if (event.body) {
            let body = JSON.parse(event.body)
            if (body.members)
                memberArray = body.members;

            let sha512 = crypto.createHash('sha512');

            let current_date = (new Date()).valueOf().toString() + Math.random();
            sha512.update(current_date);
            let grouphash = crypto.createHash('sha512').update(current_date).digest('hex');

            for (let i = 0; i < memberArray.length; i++) {
                current_date = (new Date()).valueOf().toString() + Math.random();
                sha512.update(current_date);
                let memberhash = crypto.createHash('sha512').update(current_date).digest('hex');

                let params = {
                    TableName: 'Teleto-members',
                    Item: {
                        "grouphash": grouphash,
                        "memberhash": memberhash,
                        "membername": memberArray[i].name
                    }
                };
                await documentClient.put(params).promise();
            }
            const res = {
                "grouphash": grouphash
            }
            response.body = JSON.stringify(res);

            return response;
        }
        else {
            response.statusCode = 401;
            response.body = "gloup hash is not assigned."
            return response;
        }
    }
    catch (e) {
        response.statusCode = 402;
        response.body = e.toString();
        return response;
    }
};

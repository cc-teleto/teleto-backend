let AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

exports.handler = async (event) => {
  let response = {
    statusCode: 200,
    body: '',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
  try {
    let result = '';
    let params = {
      TableName: TABLE_NAME,
      ExpressionAttributeNames: { '#x': PRIMARY_KEY },
      ExpressionAttributeValues: { ':y': event.queryStringParameters[PRIMARY_KEY] },
      KeyConditionExpression: '#x = :y',
    };
    let resultJSON = await documentClient.query(params).promise();

    if (event.queryStringParameters !== null) {
      if (event.queryStringParameters['random'] === 'true') {
        let random = Math.floor(Math.random() * resultJSON.Count);
        let resultMember = [resultJSON.Items[random]];
        response.body = JSON.stringify({ value: resultMember[0].membername });
      } else {
        result = resultJSON.Items;
        response.body = JSON.stringify({ members: result });
      }
    } else {
      result = resultJSON.Items;
      response.body = JSON.stringify(result);
    }

    return response;
  } catch (e) {
    response.statusCode = 402;
    response.body = 'Error: request schema is invalid.';
    console.log(e);
    return response;
  }
};

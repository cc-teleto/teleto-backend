const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    body: '',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE',
    },
  };
  try {
    const result = '';
    const params = {
      TableName: 'Teleto-members',
      Key: {
        grouphash: event.queryStringParameters['grouphash'],
        memberhash: event.queryStringParameters['memberhash'],
      },
    };
    console.log(params);
    const resultJSON = await documentClient.delete(params).promise();

    response.body = JSON.stringify({ memberhash: event.queryStringParameters['memberhash'] });
    return response;
  } catch (e) {
    response.statusCode = 402;
    response.body = 'Error: request schema is invalid.';
    console.log(e);
    return response;
  }
};

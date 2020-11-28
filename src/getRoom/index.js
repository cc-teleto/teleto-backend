let AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

const ROOMS_TABLE_NAME = process.env.ROOMS_TABLE_NAME || "";
const MEMBERS_TABLE_NAME = process.env.MEMBERS_TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

exports.handler = async (event) => {
  let response = {
    statusCode: 200,
    body: "",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const body = JSON.parse(event.body);
    const groupHash = event.queryStringParameters[PRIMARY_KEY];

    let result = "";
    let membersParams = {
      TableName: MEMBERS_TABLE_NAME,
      ExpressionAttributeNames: { "#x": PRIMARY_KEY },
      ExpressionAttributeValues: {
        ":y": groupHash,
      },
      KeyConditionExpression: "#x = :y",
    };
    let membersResultJSON = await documentClient.query(membersParams).promise();
    let roomsParams = {
      TableName: ROOMS_TABLE_NAME,
      ExpressionAttributeNames: { "#x": PRIMARY_KEY },
      ExpressionAttributeValues: {
        ":y": groupHash,
      },
      KeyConditionExpression: "#x = :y",
    };
    let roomsResultJSON = await documentClient.query(roomsParams).promise();

    result = { members: membersResultJSON.Items, ...roomsResultJSON.Items[0] };
    response.body = JSON.stringify(result);

    return response;
  } catch (e) {
    response.statusCode = 402;
    response.body = "Error: request schema is invalid.";
    console.log(e);
    return response;
  }
};

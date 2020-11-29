// Copyright 2018-2020Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.REGION,
});

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const connectionid = event.requestContext.connectionId;
  console.log("connection id: " + connectionid);
  // Query GroupHash
  let connectionData;
  let connectionDataParams = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#c = :connid",
    ExpressionAttributeNames: {
      "#c": "connectionid",
    },
    ExpressionAttributeValues: {
      ":connid": connectionid,
    },
  };
  try {
    connectionData = await ddb.query(connectionDataParams).promise();
    console.log("connectionData: " + JSON.stringify(connectionData));
  } catch (e) {
    console.log("error in connectionData Query: " + e);
    return { statusCode: 500, body: e.stack };
  }
  let groupData;
  let groupDataParams = {
    TableName: TABLE_NAME,
    ProjectionExpression: "connectionid",
    FilterExpression: "#g = :grouphash",
    ExpressionAttributeNames: {
      "#g": "grouphash",
    },
    ExpressionAttributeValues: {
      ":grouphash": connectionData.Items[0].grouphash,
    },
  };
  try {
    groupData = await ddb.scan(groupDataParams).promise();
    console.log("groupData: " + JSON.stringify(groupData));
  } catch (e) {
    console.log("error in groupData Scan: " + e);
    return { statusCode: 500, body: e.stack };
  }

  // Generate random angle
  const randomAngle = String(Math.floor(Math.random() * 360));
  console.log("randomAngle: " + randomAngle);

  // Send randome angle to group
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });
  const postData = randomAngle;
  const postCalls = groupData.Items.map(async ({ connectionid }) => {
    try {
      await apigwManagementApi
        .postToConnection({ ConnectionId: connectionid, Data: postData })
        .promise();
    } catch (e) {
      console.log("error in post api: " + e);
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionid}`);
        await ddb
          .delete({ TableName: TABLE_NAME, Key: { connectionid } })
          .promise();
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    console.log("error in post api Promise.all: " + e);
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: "Data sent." };
};

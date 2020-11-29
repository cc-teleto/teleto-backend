// Copyright 2018-2020Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.REGION,
});

const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME;
const ROOMS_TABLE_NAME = process.env.ROOMS_TABLE_NAME;

exports.handler = async (event) => {
  const connectionid = event.requestContext.connectionId;
  const category = JSON.parse(event.body).category;
  const num = JSON.parse(event.body).num;
  console.log("connection id: " + connectionid);
  // Query GroupHash
  let connectionData;
  let connectionDataParams = {
    TableName: CONNECTIONS_TABLE_NAME,
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
  const grouphash = connectionData.Items[0].grouphash;
  let groupData;
  let groupDataParams = {
    TableName: CONNECTIONS_TABLE_NAME,
    ProjectionExpression: "connectionid",
    FilterExpression: "#g = :grouphash",
    ExpressionAttributeNames: {
      "#g": "grouphash",
    },
    ExpressionAttributeValues: {
      ":grouphash": grouphash,
    },
  };
  try {
    groupData = await ddb.scan(groupDataParams).promise();
    console.log("groupData: " + JSON.stringify(groupData));
  } catch (e) {
    console.log("error in groupData Scan: " + e);
    return { statusCode: 500, body: e.stack };
  }
  let topicsData;
  let topicsDataParams = {
    TableName: TOPICS_TABLE_NAME,
    Select: "COUNT"
  };
  try {
    topicsData = await ddb.query(topicsDataParams).promise();
    console.log("roomData: " + JSON.stringify(topicsData));
  } catch (e) {
    console.log("error in topicsData Query: " + e);
    return { statusCode: 500, body: e.stack };
  }

  
  // Generate random angle
  const arr = [];
  const selectedTopics = [];
  for (let k=0;k<topicsData["COUNT"];k++) {
      arr.push(k);
  }
  console.log("COUNT"+arr);
  let a = arr.length;

  while(a) {
      let j = Math.floor(Math.random() * a);
      let t = arr[--a];
      arr[a] = arr[j];
      arr[j] = t;
  }
  console.log("COUNT"+arr);
  arr = arr.slice(0,num);
  

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
          .delete({
              TableName: CONNECTIONS_TABLE_NAME,
              Key: { connectionid },
          })
          .promise();
      } else {
          throw e;
      }
  }
    

try {
      await Promise.all(postCalls);
    } catch (e) {
      console.log("error in post api Promise.all: " + e);
      return { statusCode: 500, body: e.stack };
    }

    // Update Room Status in DB
    const updateRouletteStatus = "Spinning";
    const updateRouletteStopAt = randomAngle;
    let updatedRoomData;
    let updateRoomParams = {
      TableName: ROOMS_TABLE_NAME,
      Key: {
        grouphash: grouphash,
      },
      UpdateExpression: "set rouletteStatus = :s, rouletteStopAt = :a",
      ExpressionAttributeValues: {
        ":s": updateRouletteStatus,
        ":a": updateRouletteStopAt,
      },
      ReturnValues: "UPDATED_NEW",
    };
    try {
      updatedRoomData = await ddb.update(updateRoomParams).promise();
      console.log("updatedRoomData: " + JSON.stringify(updatedRoomData));
    } catch (e) {
      console.log("error in roomData Update: " + e);
      return { statusCode: 500, body: e.stack };
    }

    return { statusCode: 200, body: "Data sent." };
  } else {
    console.log("Roulette should not be started.");
    return { statusCode: 200, body: "No action required." };
  }
};

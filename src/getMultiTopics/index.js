// Copyright 2018-2020Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.REGION,
});

const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME;
const TOPICS_TABLE_NAME = process.env.TOPICS_TABLE_NAME;

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
  for (let k=0;k<topicsData.Count;k++) {
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
  
  arr.forEach((value) => {
    let string = eval("`" + topicsData.Items[value].topic.template + "`");
    topicsData.Items[value].topic.template = string;
    selectedTopics.push(topicsData.Items[value].topic.template);
  });
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  const postData = selectedTopics;
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
  });    

  try {
      await Promise.all(postCalls);
  } catch (e) {
      console.log("error in post api Promise.all: " + e);
      return { statusCode: 500, body: e.stack };
  }
};

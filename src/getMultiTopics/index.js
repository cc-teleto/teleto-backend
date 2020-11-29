// Copyright 2018-2020Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.REGION,
});

const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME;
const TOPICS_TABLE_NAME = process.env.TOPICS_TABLE_NAME;
const ROOMS_TABLE_NAME = process.env.ROOMS_TABLE_NAME;

exports.handler = async (event) => {
  const myConnectionid = event.requestContext.connectionId;
  const category = JSON.parse(event.body).category;
  const num = JSON.parse(event.body).num;
  console.log("connection id: " + myConnectionid);
  // Query GroupHash
  let connectionData;
  let connectionDataParams = {
    TableName: CONNECTIONS_TABLE_NAME,
    KeyConditionExpression: "#c = :connid",
    ExpressionAttributeNames: {
      "#c": "connectionid",
    },
    ExpressionAttributeValues: {
      ":connid": myConnectionid,
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
  let roomData;
  let roomDataParams = {
    TableName: ROOMS_TABLE_NAME,
    KeyConditionExpression: "#g = :grouphash",
    ExpressionAttributeNames: {
      "#g": "grouphash",
    },
    ExpressionAttributeValues: {
      ":grouphash": grouphash,
    },
  };
  try {
    roomData = await ddb.query(roomDataParams).promise();
    console.log("roomData: " + JSON.stringify(roomData));
  } catch (e) {
    console.log("error in roomData Query: " + e);
    return { statusCode: 500, body: e.stack };
  }
  let selectedTopics;
  if (roomData.Items[0].topics === null) {
    console.log("roomData.topics is null");
    let topicsData;
    let topicsDataParams = {
      TableName: TOPICS_TABLE_NAME,
    };
    try {
      topicsData = await ddb.scan(topicsDataParams).promise();
      console.log("topicsData: " + JSON.stringify(topicsData));
    } catch (e) {
      console.log("error in topicsData Query: " + e);
      return { statusCode: 500, body: e.stack };
    }

    // Generate random angle
    const arr = [];
    selectedTopics = [];
    for (let k = 0; k < topicsData.Count; k++) {
      arr.push(k);
    }
    console.log("COUNT" + arr);
    let a = arr.length;

    while (a) {
      let j = Math.floor(Math.random() * a);
      let t = arr[--a];
      arr[a] = arr[j];
      arr[j] = t;
    }
    console.log("COUNT" + arr);
    const selectedArr = arr.slice(0, num);
    let opt = [];
    for (let value of selectedArr) {
      //selectedArr.forEach(async(value) => {
      for (let i = 0; i < topicsData.Items[value].topic.option.length; i++) {
        if (topicsData.Items[value].topic.option[i] === "members") {
          params = {
            TableName: "Teleto-members",
            //ExpressionAttributeNames: { "#x": "grouphash" },
            ExpressionAttributeValues: {
              ":y": grouphash,
            },
            KeyConditionExpression: "grouphash = :y",
          };
          let resultMember = "";
          resultJSON = await ddb.query(params).promise();
          console.log("memberquery" + JSON.stringify(resultJSON));
          random = Math.floor(Math.random() * resultJSON.Count);

          resultMember = [resultJSON.Items[random]];
          opt[i] = resultMember[0].membername;
        } else if (
          topicsData.Items[value].topic.option[i] === "trends.twitter"
        ) {
          params = {
            TableName: "Teleto-trends-twitter",
          };
          let resultTrend = "";
          resultJSON = await ddb.scan(params).promise();
          console.log("trendquery" + JSON.stringify(resultJSON));
          random = Math.floor(Math.random() * resultJSON.Count);

          resultTrend = [resultJSON.Items[random]];
          opt[i] = resultTrend[0].name;
        } else {
          params = {
            TableName: "Teleto-options",
            ExpressionAttributeNames: { "#x": "groupname" },
            ExpressionAttributeValues: {
              ":y": topicsData.Items[value].topic.option[i],
            },
            KeyConditionExpression: "#x = :y",
          };
          let resultOption = "";
          resultJSON = await ddb.query(params).promise();
          console.log("elsequery" + JSON.stringify(resultJSON));
          random = Math.floor(Math.random() * resultJSON.Count);

          resultOption = [resultJSON.Items[random]];
          opt[i] = resultOption[0].word;
        }
      }
      let string = eval("`" + topicsData.Items[value].topic.template + "`");
      console.log("string" + string);
      let keyword = eval("`" + topicsData.Items[value].keyword + "`");
      console.log("keyword" + keyword);
      topicsData.Items[value].topic.template = string;
      selectedTopics.push({
        topic: topicsData.Items[value].topic.template,
        keyword,
      });
    }
    console.log("finish db");
    // Update Room Table
    let updatedRoomData;
    let updateRoomParams = {
      TableName: ROOMS_TABLE_NAME,
      Key: {
        grouphash: grouphash,
      },
      UpdateExpression: "set topics = :t",
      ConditionExpression: "topics = :n",
      ExpressionAttributeValues: {
        ":t": selectedTopics,
        ":n": null,
      },
      ReturnValues: "UPDATED_NEW",
    };
    try {
      updatedRoomData = await ddb.update(updateRoomParams).promise();
      console.log("updatedRoomData: " + JSON.stringify(updatedRoomData));
    } catch (e) {
      roomData = await ddb.query(roomDataParams).promise();
      console.log("error in roomData Update: " + e);
      console.log("error in roomData Update(roomData): " + roomData);
      selectedTopics = roomData.Items[0].topics;
    }
  } else {
    console.log("roomData.topics is not null");
    selectedTopics = roomData.Items[0].topics;
  }

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });
  const postData = JSON.stringify({
    action: "getmultitopics",
    topics: selectedTopics,
  });
  //const postData = selectedTopics.toString();
  console.log("postData" + postData);
  const postCalls = groupData.Items.map(async ({ connectionid }) => {
    try {
      if(myConnectionid === connectionid){
      await apigwManagementApi
        .postToConnection({ ConnectionId: connectionid, Data: postData })
        .promise();
      }
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

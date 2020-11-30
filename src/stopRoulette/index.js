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
  const roulette = JSON.parse(event.body).roulette;
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

  // Handle Room Status
  const roomStatus = roomData.Items[0];
  // IF At TalkerRoulette or TopicRoulette screen and rouletteStatus is Stopped
  if (
    (roomStatus.onWhichScreen === "TalkerRoulette" ||
      roomStatus.onWhichScreen === "TopicRoulette") &&
    roomStatus.rouletteStatus === "Spinning"
  ) {
    // Update Room Status in DB
    const updateRouletteStatus = "Stopped";
    let updatedRoomData;
    let updateRoomParams;
    if (roulette === "Talker") {
      const selectedTalker = JSON.parse(event.body).selectedTalker;
      let updateOnwhichScreen;
      if (roomStatus.selectedTopic === null) {
        updateOnWhichScreen = "TopicRoulette";
      } else {
        updateOnWhichScreen = "Result";
      }
      updateRoomParams = {
        TableName: ROOMS_TABLE_NAME,
        Key: {
          grouphash: grouphash,
        },
        UpdateExpression:
          "set rouletteStatus = :s, onWhichScreen = :sc, selectedTalker = :t",
        ExpressionAttributeValues: {
          ":s": updateRouletteStatus,
          ":sc": updateOnWhichScreen,
          ":t": selectedTalker,
        },
        ReturnValues: "UPDATED_NEW",
      };
    } else if (roulette === "Topic") {
      const selectedTopic = JSON.parse(event.body).selectedTopic;
      let updateOnwhichScreen = "Result";
      updateRoomParams = {
        TableName: ROOMS_TABLE_NAME,
        Key: {
          grouphash: grouphash,
        },
        UpdateExpression:
          "set rouletteStatus = :s, onWhichScreen = :sc, selectedTopic = :t",
        ExpressionAttributeValues: {
          ":s": updateRouletteStatus,
          ":sc": updateOnWhichScreen,
          ":t": selectedTopic,
        },
        ReturnValues: "UPDATED_NEW",
      };
    }
    try {
      updatedRoomData = await ddb.update(updateRoomParams).promise();
      console.log("updatedRoomData: " + JSON.stringify(updatedRoomData));
    } catch (e) {
      console.log("error in roomData Update: " + e);
      return { statusCode: 500, body: e.stack };
    }

    return { statusCode: 200, body: "Data sent." };
  } else {
    console.log("Roulette already stopped.");
    return { statusCode: 200, body: "No action required." };
  }
};

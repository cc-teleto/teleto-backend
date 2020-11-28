// Copyright 2018-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.REGION,
});

exports.handler = async (event) => {
  const patchParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionid: event.requestContext.connectionId,
    },
    UpdateExpression: "set grouphash = :g",
    ExpressionAttributeValues: {
      ":g": JSON.parse(event.body).grouphash,
    },
    ReturnValues: "UPDATED_NEW",
  };

  console.log("grouphashをTeleto-connectionsテーブルに登録します");

  try {
    await ddb.update(patchParams).promise();
  } catch (err) {
    console.log("error:" + JSON.stringify(err));
    return {
      statusCode: 500,
      body: "Failed to connect: " + JSON.stringify(err),
    };
  }

  return { statusCode: 200, body: "Connected." };
};

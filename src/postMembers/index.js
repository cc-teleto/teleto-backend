const crypto = require("crypto");
const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

exports.handler = async (event) => {
  const response = {
    statusCode: 201,
    body: "",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };

  let memberArray;
  try {
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.members) memberArray = body.members;

      let grouphash;
      const sha512 = crypto.createHash("sha512");
      let current_date;
      console.log("event.queryStringParameters:", event.queryStringParameters);
      if (event.queryStringParameters !== null) {
        grouphash = event.queryStringParameters[PRIMARY_KEY];
      } else {
        current_date = new Date().valueOf().toString() + Math.random();
        sha512.update(current_date);
        grouphash = crypto
          .createHash("sha512")
          .update(current_date)
          .digest("hex");
      }

      for (let i = 0; i < memberArray.length; i++) {
        current_date = new Date().valueOf().toString() + Math.random();
        sha512.update(current_date);
        const memberhash = crypto
          .createHash("sha512")
          .update(current_date)
          .digest("hex");

        const params = {
          TableName: TABLE_NAME,
          Item: {
            grouphash: grouphash,
            memberhash: memberhash,
            membername: memberArray[i].name,
          },
        };
        console.log("DB Update params:", params);
        await documentClient.put(params).promise();
      }
      const res = {
        grouphash: grouphash,
      };
      response.body = JSON.stringify(res);

      return response;
    } else {
      response.statusCode = 401;
      response.body = "group hash is not assigned.";
      return response;
    }
  } catch (e) {
    console.log("error: ", e);
    response.statusCode = 402;
    response.body = e.toString();
    return response;
  }
};

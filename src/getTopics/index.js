let AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

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
    let result = "";
    let params = {
      TableName: "Teleto-topics",
    };

    let resultJSON = await documentClient.scan(params).promise();
    if ("category" in event.queryStringParameters) {
      let tmpList = {
        Items: [],
        Count: 0,
        ScannedCount: 0,
      };
      for (let i = 0; i < resultJSON.Count; i++) {
        for (let j = 0; j < resultJSON.Items[i].category.length; j++) {
          if (
            resultJSON.Items[i].category[j] ===
            event.queryStringParameters.category
          ) {
            tmpList.Items.push(resultJSON.Items[i]);
            tmpList.Count++;
            tmpList.ScannedCount++;
          }
        }
      }
      resultJSON = tmpList;
    }

    if ("random" in event.queryStringParameters) {
      if (event.queryStringParameters["random"] === "true") {
        let random = Math.floor(Math.random() * resultJSON.Count);

        result = [resultJSON.Items[random]];
        if ("option" in result[0].topic) {
          let opt = [];

          for (let i = 0; i < result[0].topic.option.length; i++) {
            if (result[0].topic.option[i] === "members") {
              params = {
                TableName: "Teleto-members",
                ExpressionAttributeNames: { "#x": "grouphash" },
                ExpressionAttributeValues: {
                  ":y": event.queryStringParameters["grouphash"],
                },
                KeyConditionExpression: "#x = :y",
              };
              let resultMember = "";
              resultJSON = await documentClient.query(params).promise();
              random = Math.floor(Math.random() * resultJSON.Count);

              resultMember = [resultJSON.Items[random]];
              opt[i] = resultMember[0].membername;
            } else if (result[0].topic.option[i] === "trends.twitter") {
              params = {
                TableName: "Teleto-trends-twitter",
              };
              let resultTrend = "";
              resultJSON = await documentClient.scan(params).promise();
              random = Math.floor(Math.random() * resultJSON.Count);

              resultTrend = [resultJSON.Items[random]];
              opt[i] = resultTrend[0].name;
            } else {
              params = {
                TableName: "Teleto-options",
                ExpressionAttributeNames: { "#x": "groupname" },
                ExpressionAttributeValues: { ":y": result[0].topic.option[i] },
                KeyConditionExpression: "#x = :y",
              };
              let resultOption = "";
              resultJSON = await documentClient.query(params).promise();
              random = Math.floor(Math.random() * resultJSON.Count);

              resultOption = [resultJSON.Items[random]];
              opt[i] = resultOption[0].word;
            }
          }
          let string = eval("`" + result[0].topic.template + "`");
          result[0].topic.template = string;

          const resbody = { value: result[0].topic.template };
          response.body = JSON.stringify(resbody);
        }
      } else {
        result = resultJSON.Items;
        response.body = JSON.stringify(result);
      }
    } else {
      result = resultJSON.Items;
      response.body = JSON.stringify(result);
    }

    return response;
  } catch (e) {
    response.statusCode = 402;
    response.body = "Error: request schema is invalid.";
    console.log(e);
    return response;
  }
};

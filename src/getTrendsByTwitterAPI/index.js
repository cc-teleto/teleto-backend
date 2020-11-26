const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2', // DynamoDBのリージョン
});
const Twitter = require('twitter');

const twitterClient = new Twitter({
  consumer_key: process.env.TW_CONSUMER_KEY, // API Key
  consumer_secret: process.env.TW_CONSUMER_SECRET, // API Secret Key
  access_token_key: process.env.TW_ACCESS_TOKEN_KEY, // Access Token
  access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET, // Access Token Secret
});

async function getTrends(id) {
  const params = { id: id };
  const res = await twitterClient.get('trends/place.json', params);
  return res;
}

exports.handler = async (event) => {
  try {
    const id = 23424856;
    const res = await getTrends(id);
    console.log(res[0].trends[0].name);
    const trends = res[0].trends;
    const ttl = Math.round(new Date().getTime() / 1000) + 3600;

    for (let i = 0; i < trends.length; i++) {
      const params = {
        TableName: 'Teleto-trends-twitter',
        Item: {
          wogeid: id, // Partition Keyのデータ
          name: trends[i].name, // Sort Keyのデータ
          url: trends[i].url,
          tweet_volume: trends[i].tweet_volume,
          ttl: ttl,
        },
      };

      await dynamoDB.put(params).promise();
    }
  } catch (e) {
    console.log(e);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};

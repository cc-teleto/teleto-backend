// eslint-disable-next-line @typescript-eslint/interface-name-prefix
import apigateway = require("@aws-cdk/aws-apigateway");
import dynamodb = require("@aws-cdk/aws-dynamodb");
import lambda = require("@aws-cdk/aws-lambda");
import cdk = require("@aws-cdk/core");
import assets = require("@aws-cdk/aws-s3-assets");
import iam = require("@aws-cdk/aws-iam");
import { join } from "path";
import { AssetCode } from "@aws-cdk/aws-lambda";
import { CfnParameter, Fn } from "@aws-cdk/core";
import {
  CfnRole,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";

export interface ApiGatewayProps {
  ApiStage: string;
}

export class TeletoBackendStack extends cdk.Stack {
  constructor(app: cdk.App, id: string, props: ApiGatewayProps) {
    super(app, id);

    // DynamoDB setup
    const membersTable = new dynamodb.Table(this, "Teleto-members", {
      partitionKey: {
        name: "grouphash",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "memberhash",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "Teleto-members",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const topicsTable = new dynamodb.Table(this, "Teleto-topics", {
      partitionKey: {
        name: "hash",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "category",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "Teleto-topics",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const optionsTable = new dynamodb.Table(this, "Teleto-options", {
      partitionKey: {
        name: "groupname",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "word",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "Teleto-options",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const trendsTable = new dynamodb.Table(this, "Teleto-trends-twitter", {
      partitionKey: {
        name: "wogeid",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "name",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "Teleto-trends-twitter",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    // Lambda setup
    const iamRole =
      "arn:aws:iam::" +
      process.env.AWS_ACCOUNT_ID +
      ":role/LambdaAccessToDynamoDB";
    const executionLambdaRole = iam.Role.fromRoleArn(
      this,
      "dynamoDBRole",
      iamRole,
      {
        // Set 'mutable' to 'false' to use the role as-is and prevent adding new
        // policies to it. The default is 'true', which means the role may be
        // modified as part of the deployment.
        mutable: false,
      }
    );
    const GetMembersLambda = new lambda.Function(this, "GetMembersLambda", {
      code: new AssetCode("src/getMembers"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: membersTable.tableName,
        PRIMARY_KEY: "grouphash",
        REGION: process.env.AWS_REGION
          ? process.env.AWS_REGION
          : "ap-northeast-1",
      },
      role: executionLambdaRole,
    });
    const forceGetMembersLambdaId = GetMembersLambda.node
      .defaultChild as lambda.CfnFunction;
    forceGetMembersLambdaId.overrideLogicalId("GetMembersLambda");

    const PostMembersLambda = new lambda.Function(this, "PostMembersLambda", {
      code: new AssetCode("src/postMembers"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: membersTable.tableName,
        PRIMARY_KEY: "grouphash",
        REGION: process.env.AWS_REGION
          ? process.env.AWS_REGION
          : "ap-northeast-1",
      },
      role: executionLambdaRole,
    });
    const forcePostMembersLambdaId = PostMembersLambda.node
      .defaultChild as lambda.CfnFunction;
    forcePostMembersLambdaId.overrideLogicalId("PostMembersLambda");

    const DeleteMembersLambda = new lambda.Function(
      this,
      "DeleteMembersLambda",
      {
        code: new AssetCode("src/deleteMember"),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_12_X,
        environment: {
          TABLE_NAME: membersTable.tableName,
          PRIMARY_KEY: "grouphash",
          REGION: process.env.AWS_REGION
            ? process.env.AWS_REGION
            : "ap-northeast-1",
        },
        role: executionLambdaRole,
      }
    );
    const forceDeleteMembersLambdaId = DeleteMembersLambda.node
      .defaultChild as lambda.CfnFunction;
    forceDeleteMembersLambdaId.overrideLogicalId("DeleteMembersLambda");

    const GetTopicsLambda = new lambda.Function(this, "GetTopicsLambda", {
      code: new AssetCode("src/deleteMember"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: topicsTable.tableName,
        PRIMARY_KEY: "grouphash",
        REGION: process.env.AWS_REGION
          ? process.env.AWS_REGION
          : "ap-northeast-1",
      },
      role: executionLambdaRole,
    });
    const forceGetTopicsLambdaId = GetTopicsLambda.node
      .defaultChild as lambda.CfnFunction;
    forceGetTopicsLambdaId.overrideLogicalId("GetTopicsLambda");

    const GetTrendsByTwitterLambda = new lambda.Function(
      this,
      "GetTrendsByTwitterLambda",
      {
        code: new AssetCode("src/getTrendsByTwitterAPI"),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_12_X,
        environment: {
          TABLE_NAME: trendsTable.tableName,
          PRIMARY_KEY: "grouphash",
          REGION: process.env.AWS_REGION
            ? process.env.AWS_REGION
            : "ap-northeast-1",
          TW_CONSUMER_KEY: process.env.TW_CONSUMER_KEY
            ? process.env.TW_CONSUMER_KEY
            : "", // API Key
          TW_CONSUMER_SECRET: process.env.TW_CONSUMER_SECRET
            ? process.env.TW_CONSUMER_SECRET
            : "", // API Secret Key
          TW_ACCESS_TOKEN_KEY: process.env.TW_ACCESS_TOKEN_KEY
            ? process.env.TW_ACCESS_TOKEN_KEY
            : "", // Access Token
          TW_ACCESS_TOKEN_SECRET: process.env.TW_ACCESS_TOKEN_SECRET
            ? process.env.TW_ACCESS_TOKEN_SECRET
            : "", // Access Token Secret
        },
        role: executionLambdaRole,
      }
    );
    const forceGetTrendsByTwitterLambda = GetTrendsByTwitterLambda.node
      .defaultChild as lambda.CfnFunction;
    forceGetTrendsByTwitterLambda.overrideLogicalId("GetTrendsByTwitterLambda");

    // grant access
    membersTable.grantFullAccess(GetMembersLambda);
    membersTable.grantFullAccess(PostMembersLambda);
    membersTable.grantFullAccess(DeleteMembersLambda);
    membersTable.grantFullAccess(GetTopicsLambda);
    membersTable.grantFullAccess(GetTopicsLambda);

    // API Gateway setup
    const ApiStage = new CfnParameter(this, "ApiStage", {
      type: "String",
      default: props.ApiStage,
    });
    ApiStage.overrideLogicalId("ApiStage");

    const apiRole = new Role(this, "apiRole", {
      roleName: process.env.STAGE + "ApiRole",
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });

    apiRole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["lambda:InvokeFunction"],
      })
    );

    // // apiRoleを既存のものから取得
    // const arnApiRole =
    //   "arn:aws:iam::" +
    //   process.env.AWS_ACCOUNT_ID +
    //   ":role/aws-service-role/ops.apigateway.amazonaws.com/AWSServiceRoleForAPIGateway";
    // const apiRole = iam.Role.fromRoleArn(this, "apiRole", arnApiRole, {
    //   // Set 'mutable' to 'false' to use the role as-is and prevent adding new
    //   // policies to it. The default is 'true', which means the role may be
    //   // modified as part of the deployment.
    //   mutable: false,
    // });

    const forceApiRoleId = apiRole.node.defaultChild as CfnRole;
    forceApiRoleId.overrideLogicalId("apiRole");

    // Upload Swagger to S3
    const fileAsset = new assets.Asset(this, "SwaggerAsset", {
      path: join(__dirname, "../template/teleto-api.yaml"),
    });
    const data = Fn.transform("AWS::Include", {
      Location: fileAsset.s3ObjectUrl,
    });
    const SuperApiDefinition = apigateway.AssetApiDefinition.fromInline(data);
    const api = new apigateway.SpecRestApi(this, "teletoApi", {
      apiDefinition: SuperApiDefinition,
      deploy: true,
    });

    // api.root.addMethod('ANY', new apigateway.MockIntegration());
  }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}

const app = new cdk.App();
new TeletoBackendStack(app, "TeletoBackendStack", {
  ApiStage: process.env.STAGE ? process.env.STAGE : "prod",
});
app.synth();

import apigateway = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');
import assets = require('@aws-cdk/aws-s3-assets');
import { join } from 'path';
import { AssetCode } from '@aws-cdk/aws-lambda';
import { CfnParameter, Fn } from '@aws-cdk/core';
import { CfnRole, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';

export interface ApiGatewayProps {
  ApiStage: string;
}

export class TeletoBackendStack extends cdk.Stack {
  constructor(app: cdk.App, id: string, props: ApiGatewayProps) {
    super(app, id);

    // DynamoDB setup
    const dynamoTable = new dynamodb.Table(this, 'Teleto-members', {
      partitionKey: {
        name: 'grouphash',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'memberhash',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: 'Teleto-members',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    // Lambda setup
    const GetMembersLambda = new lambda.Function(this, 'GetMembersLambda', {
      code: new AssetCode('src/getMembers'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'grouphash',
        REGION: process.env.REGION ? process.env.REGION : 'ap-northeast-1',
      },
    });
    const forceGetMembersLambdaId = GetMembersLambda.node.defaultChild as lambda.CfnFunction;
    forceGetMembersLambdaId.overrideLogicalId('GetMembersLambda');

    const PostMembersLambda = new lambda.Function(this, 'PostMembersLambda', {
      code: new AssetCode('src/postMembers'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'grouphash',
        REGION: process.env.REGION ? process.env.REGION : 'ap-northeast-1',
      },
    });
    const forcePostMembersLambdaId = PostMembersLambda.node.defaultChild as lambda.CfnFunction;
    forcePostMembersLambdaId.overrideLogicalId('PostMembersLambda');

    // grant access
    dynamoTable.grantFullAccess(GetMembersLambda);
    dynamoTable.grantFullAccess(PostMembersLambda);

    // API Gateway setup
    const ApiStage = new CfnParameter(this, 'ApiStage', {
      type: 'String',
      default: props.ApiStage,
    });
    ApiStage.overrideLogicalId('ApiStage');

    const apiRole = new Role(this, 'apiRole', {
      roleName: 'apiRole',
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });

    apiRole.addToPolicy(
      new PolicyStatement({
        resources: ['*'],
        actions: ['lambda:InvokeFunction'],
      }),
    );
    const forceApiRoleId = apiRole.node.defaultChild as CfnRole;
    forceApiRoleId.overrideLogicalId('apiRole');

    // Upload Swagger to S3
    const fileAsset = new assets.Asset(this, 'SwaggerAsset', {
      path: join(__dirname, '../template/teleto-api.yaml'),
    });
    const data = Fn.transform('AWS::Include', { Location: fileAsset.s3ObjectUrl });
    const SuperApiDefinition = apigateway.AssetApiDefinition.fromInline(data);
    const api = new apigateway.SpecRestApi(this, 'teletoApi', {
      apiDefinition: SuperApiDefinition,
      deploy: true,
    });

    // api.root.addMethod('ANY', new apigateway.MockIntegration());
  }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod(
    'OPTIONS',
    new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    },
  );
}

const app = new cdk.App();
new TeletoBackendStack(app, 'TeletoBackendStack', {
  ApiStage: 'prod',
});
app.synth();

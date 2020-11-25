# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


# API一覧

## /topics

### GET

- 概要
  - 話題を取得します。

- リクエスト

  - URLクエリ文字列パラメータ
    - random
      - false: 全件取得します。
      - true: ランダムに一件取得します。
    - grouphash
      - メンバーが属するグループのgrouphashを指定します。
    - category
      - topicのカテゴリーを指定します。指定しなかった場合はすべてのtopicが対象となります。
  - リクエスト本文
    - なし

- レスポンス

  - ステータスコード200

    - レスポンス本文

      - 全件取得の場合

        ```
        [
          {
              "category":[String],
              "topic":{
                  "template": String,
                  "option": [String]
              },
              hash: String
          }
          …
        ]
        ```

      - 一件取得の場合

        ```
        {
        	value: String
        }
        ```

  - ステータスコード402

    - レスポンス本文

      ```
      Error: request schema is invalid.    
      ```

## /members

### GET

- 概要
  - メンバーを取得します。

- リクエスト

  - URLクエリ文字列パラメータ
    - random
      - false: 全件取得します。
      - true: ランダムに一件取得します。
    - grouphash
      - メンバーが属するグループのgrouphashを指定します。
  - リクエスト本文
    - なし

- レスポンス

  - ステータスコード200

    - レスポンス本文

      - 全件取得の場合

        ```
        {
            "members":[
              {
                "memberhash": String,
                "grouphash": String,
                "membername": String
              },
              …
            ]
        }
        ```

      - 一件取得の場合

        ```
        {
            value: String
        }
        ```

  - ステータスコード402

    - レスポンス本文

      ```
      Error: request schema is invalid.    
      ```

​    

### POST

- 概要
  - メンバーを追加します。

- リクエスト

  - URLクエリ文字列パラメータ

    - grouphash
      - 所属させたいグループのgrouphashを指定します。指定しなかった場合はランダムにgrouphashを生成して登録します。

  - リクエスト本文

    ```
    {
    	members：[
    		{
    			name: String
    		}
            …
        ]
    }
    ```

- レスポンス

  - ステータスコード201

    - レスポンス本文

      ```
      {
      	grouphash: String
      }
      ```

  - ステータスコード401

    - レスポンス本文

      ```
      gloup hash is not assigned.
      ```

  - ステータスコード402

    - レスポンス本文

      ```
      Error: request schema is invalid.    
      ```

### DELETE

- 概要
  - メンバーを削除します。

- リクエスト

  - URLクエリ文字列パラメータ
    - memberhash
      - 削除したいメンバーのmemberhashを指定します。
    - grouphash
      - 削除したいメンバーが属するグループのgrouphashを指定します。
  - リクエスト本文
    - なし

- レスポンス

  - ステータスコード200

    - レスポンス本文

      ```
      {
      	memberhash: String
      }
      ```

  - ステータスコード402

    - レスポンス本文

      ```
      Error: request schema is invalid.    
      ```

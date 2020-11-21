const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const TeletoBackend = require('../lib/teleto-backend-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TeletoBackend.TeletoBackendStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

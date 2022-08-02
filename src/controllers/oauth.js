const { settings } = require('service-claire/helpers/config');
const logger = require('service-claire/helpers/logger');

const {
  error,
} = require('service-claire/helpers/responses');
const rp = require('request-promise');
const {
  Auth,
} = require('../models');
const ClarityHub = require('node-clarity-hub');

const {
  authUrl,
  integrationUrl,
  appsUrl,
  integrationUuid,
} = settings;

const handleOauthOnboarding = async ({
  accessToken,
  publicKey,
  accountId,
}) => {
  try {
    const [, created] = await Auth.findOrCreate({
      where: {
        accountId,
      },
      defaults: {
        accessToken,
        publicKey,
        accountId,
      },
    });

    if (!created) {
      await Auth.update({
        accessToken,
        publicKey,
      }, {
        where: {
          accountId,
        },
      });
    }

    const clarityHub = new ClarityHub({
      accessToken,
      url: integrationUrl,
    });

    const script = `<script type="text/javascript" src="${appsUrl}/scripts/chat.js?API_KEY=${publicKey}">
</script>`;

    await clarityHub.integrationSettings.update({
      integrationUuid,
      settings: [
        {
          type: 'text',
          value: 'Add the following HTML to your website:',
        },
        {
          type: 'textarea',
          value: script,
          label: 'Widget Code',
          clipboard: true,
          disabled: true,
        },
      ],
    });

    return {
      wasAlreadyActive: !created,
      script,
    };
  } catch (err) {
    logger.error(err);
  }
};

/**
 * Use the given code to create an oauth access token.
 * This is usually caused by re-activating the integration.
 */
const handleOauthCode = async (req, res) => {
  const {
    code,
  } = req.query;

  try {
    const options = {
      method: 'POST',
      uri: `${authUrl}/auth/credentials/code/${code}/activate`,
      json: true,
      body: {
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
      },
    };

    // Get access token
    const response = await rp(options);

    const {
      wasAlreadyActive,
      script,
    } = await handleOauthOnboarding({
      accessToken: response.accessToken,
      publicKey: response.publicKey,
      accountId: response.accountId,
    });

    res.status(200).render('oauth', {
      wasAlreadyActive,
      script,
    });
  } catch (err) {
    logger.error(err);
    error(res)({});
  }
};


module.exports = {
  handleOauthOnboarding,
  handleOauthCode,
};

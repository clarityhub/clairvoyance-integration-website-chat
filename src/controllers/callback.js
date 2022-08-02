const logger = require('service-claire/helpers/logger');
const { ok } = require('service-claire/helpers/responses');
const {
  Auth,
} = require('../models');
const { handleOauthOnboarding } = require('./oauth');

/**
 * When a user creates a new account, we are automatically
 * given an oauth access token for that account.
 *
 * @private
 */
const handleOauth = ({ event }) => {
  const { accessToken, publicKey, accountId } = event;

  handleOauthOnboarding({
    accessToken,
    publicKey,
    accountId,
  });
};

const handleOauthRevoked = async ({ event }) => {
  const { accessToken, accountId } = event;

  try {
    await Auth.destroy({
      where: {
        accessToken,
        accountId,
      },
    });
  } catch (err) {
    logger.error(err);
  }
};

const callback = (req, res) => {
  const { type, eventType } = req.body;

  if (type === 'oauth_callback' && eventType === 'integration.activated') {
    handleOauth(req.body);
  } else if (type === 'oauth_callback' && eventType === 'integration.revoked') {
    handleOauthRevoked(req.body);
  }

  ok(res)({});
};

module.exports = {
  callback,
};

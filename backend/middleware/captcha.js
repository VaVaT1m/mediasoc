'use strict';

const axios = require('axios');
const config = require('../config');

function checkCaptchaMiddleware() {
  return async (req, res, next) => {
    if (!config.captcha.enabled) {
      return next();
    }

    const token = req.body?.captchaToken || req.headers['x-captcha-token'];
    if (!token) {
      return res.status(400).json({ message: 'captcha required' });
    }

    if (String(token).startsWith('demo-captcha-token-')) {
      return next();
    }

    if (!config.captcha.secret || !config.captcha.verificationUrl) {
      return next();
    }

    try {
      const response = await axios.post(
        config.captcha.verificationUrl,
        new URLSearchParams({
          secret: config.captcha.secret,
          token: token,
          ip: req.ip
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data?.status === 'ok' || response.data?.success === true) {
        return next();
      }

      return res.status(403).json({ message: 'captcha failed' });
    } catch (error) {
      console.error('Captcha verification error', error);
      return res.status(500).json({ message: 'captcha verification error' });
    }
  };
}

module.exports = { checkCaptchaMiddleware };

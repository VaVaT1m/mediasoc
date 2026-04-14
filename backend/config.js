'use strict';

module.exports = {
  db: {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mediasok'
  },
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  moderatorsFile: 'moderators.txt',
  initialModerators: [],
  uploads: {
    useS3: false,
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || '',
      bucket: process.env.AWS_S3_BUCKET || ''
    },
    localUploadDir: 'uploads'
  },
  captcha: {
    enabled: false,
    secret: process.env.YANDEX_CAPTCHA_SECRET || '',
    verificationUrl: process.env.YANDEX_CAPTCHA_VERIFY_URL || ''
  },
  apiBase: '/api'
};

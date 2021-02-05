module.exports = {
  apps: [
    {
      name: 'app',
      script: './src/app.js',
      instances: 'max',
      env_development: {
        NODE_ENV: 'development',
        BASE_URL_HOST_DEV: 'localhost:4000',
        MONGODB_URL:
          'mongodb+srv://dcc:rahasia@cluster0.vdzld.mongodb.net/dcc_komputer',
        JWT_KEY: 'CoronaWillGone',
        OTP_PROVIDER_DEFAULT: 'exotel',
        NEXMO_API_SECRET: 'ePy700aFA2bY61Jw',
        RAJA_ONGKIR_API_KEY: '71f76adc0b7213e66ff3afee64427966',
        Zenziva_passkey: 'nfv6k1ydzo',
        Zenziva_userKey: 'xw2aj8',
      },
      env_production: {
        NODE_ENV: 'production',
        BASE_URL_HOST_DEV:
          'https://dcc-training.herokuapp.com/',
        MONGODB_URL:
          'mongodb+srv://dcc:rahasia@cluster0.vdzld.mongodb.net/dcc_komputer',
        JWT_KEY: 'CoronaWillGone',
        OTP_PROVIDER_DEFAULT: 'nexmo',
        NEXMO_API_SECRET: 'ePy700aFA2bY61Jw',
        RAJA_ONGKIR_API_KEY: '71f76adc0b7213e66ff3afee64427966',
        Zenziva_passkey: 'nfv6k1ydzo',
        Zenziva_userKey: 'xw2aj8',
      },
    },
  ],
}

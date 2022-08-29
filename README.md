# ERB-typescript-webpack

Eelectron React Boilerplate with typescript and webpack!

react ver: 17,
electron ver: 20


---------------usage dotenv-------------------

1.create .env file in your project dir.
2.add webpack.config
ex)
const Dotenv = require('dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new Dotenv()
  ]
  ...
};


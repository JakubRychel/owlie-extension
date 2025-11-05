const { override } = require('customize-cra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const overrideEntry = (config) => {
  config.entry = {
    main: './src/popup',
    background: './src/background',
    content: './src/content'
  };

  return config;
};

const overrideOutput = (config) => {
  config.output = {
    ...config.output,
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[name].js'
  };

  config.plugins = config.plugins.map((plugin) => {
    if (plugin instanceof HtmlWebpackPlugin) {
      return new HtmlWebpackPlugin({
        ...plugin.options,
        excludeChunks: ['background', 'content']
      });
    }
    else if (plugin instanceof MiniCssExtractPlugin) {
      return new MiniCssExtractPlugin({
        ...plugin.options,
        filename: 'static/css/[name].css',
        chunkFilename: 'static/css/[name].chunk.css'
      })
    }
    return plugin;
  });

  return config;
};

module.exports = {
  webpack: (config) => override(overrideEntry, overrideOutput)(config),
};
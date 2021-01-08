const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const path = require("path");
const pkg = require("./package.json");

const shouldProfile = process.env.PROFILE === "true";

module.exports = {
  devtool: "source-map",
  entry: "./src/index.tsx",
  externals: [nodeExternals()],
  mode: "production",
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin(),
    ],
    splitChunks: {
     chunks: "all",
    },
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    library: pkg.name,
    libraryTarget: "umd",
    publicPath: "./",
    umdNamedDefine: true,
  },
  plugins: [
    shouldProfile && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
  resolve: {
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx"],
    fallback: {
      crypto: false,
      fs: false,
      path: false,
    },
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
  target: "web",
};

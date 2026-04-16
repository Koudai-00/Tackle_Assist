const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

config.resolver.blockList = [
  /\.local\/skills\/.*/,
  /\.local\/secondary_skills\/.*/,
];

const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-google-mobile-ads") {
    return {
      filePath: path.resolve(__dirname, "stubs/react-native-google-mobile-ads.js"),
      type: "sourceFile",
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

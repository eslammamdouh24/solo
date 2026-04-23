// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Victory/D3 packages - Metro doesn't handle "exports" field well
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix d3-* package resolution issues
  if (moduleName.startsWith("d3-")) {
    try {
      const pkgPath = require.resolve(`${moduleName}/package.json`, {
        paths: [context.originModulePath],
      });
      const pkg = require(pkgPath);

      // Use 'main' field instead of 'exports' for Metro
      if (pkg.main) {
        const resolvedPath = pkgPath.replace("/package.json", `/${pkg.main}`);
        return {
          type: "sourceFile",
          filePath: resolvedPath,
        };
      }
    } catch (e) {
      // Fall through to default resolution
    }
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

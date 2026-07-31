/**
 * Dynamic Expo config layered over app.json.
 *
 * Only reason this file exists: the web build needs a different asset base path
 * depending on where it is hosted.
 *
 *   EAS Hosting      served from the domain root      → no baseUrl
 *   GitHub Pages     served from /catch-app/app       → baseUrl required
 *
 * Hardcoding either one silently breaks the other — assets 404 while the HTML loads,
 * so the page renders blank rather than erroring. Set CATCH_WEB_BASE_URL only for the
 * GitHub Pages build (scripts/deploy-web.sh does this).
 */

module.exports = ({ config }) => {
  const baseUrl = process.env.CATCH_WEB_BASE_URL;

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};

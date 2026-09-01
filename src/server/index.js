export default {
  async fetch(request, env) {
    const asset = await env.ASSETS.fetch(request);

    if (asset.status !== 404) return asset;

    // The application is a single-page app, so client-side routes use index.html.
    return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  }
};

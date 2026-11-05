// The site's own origin. It used to live in sitemap.ts, which reads every MDX
// post: a serverless route wanting nothing but the hostname had to bundle the
// content layer to get it.
export const baseUrl = "https://www.axismaps.com";

// The line under the company name, in the home page title and on the generated
// social card. It lives here so the /og route can have it without bundling
// metadata.ts, which measures files on disk.
export const siteTagline = "Interactive maps designed by cartographers";

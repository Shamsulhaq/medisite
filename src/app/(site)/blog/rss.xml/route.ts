import { getPublishedPosts, getSettings } from "@/lib/store";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const locale = settings.defaultLanguage;
  const posts = await getPublishedPosts();

  const siteTitle = t(settings.siteTitle, locale);
  const siteDescription = t(settings.metaDescription, locale);
  const siteUrl = "https://drmahmudmiju.com"; // base URL

  const items = posts
    .map((post) => {
      const title = t(post.title, locale);
      const description = t(post.excerpt, locale);
      const link = `${siteUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      return `    <item>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteTitle}]]></title>
    <description><![CDATA[${siteDescription}]]></description>
    <link>${siteUrl}/blog</link>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <language>${locale === "bn" ? "bn" : "en"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function getPublishedNews(items = []) {
  return [...items]
    .filter((item) => !item?.status || item.status === "published")
    .sort((left, right) => {
      if (Boolean(left?.featured) !== Boolean(right?.featured)) {
        return left?.featured ? -1 : 1;
      }

      const leftDate = new Date(left?.publishedAt || 0).getTime();
      const rightDate = new Date(right?.publishedAt || 0).getTime();
      return rightDate - leftDate;
    });
}

export type EventItem = {
  sys: { id: string };
  name: string;
  slug: string;
  caption?: string;
  startDate?: string;
  endDate?: string;
  isValid?: string;

  mediaField?: {
    altText?: string;
    jsonBynderAsset?: {
      type?: string;
      title?: string;
      thumbnail?: string;
      originalUrl?: string;
      width?: number;
      height?: number;
      size?: number;
    };
  };
};
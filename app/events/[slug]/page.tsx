import { gql } from "@apollo/client";
import { client } from "@/lib/apolloClient";
import { getImageUrl } from "@/lib/getImageUrl";

type Props = {
  params: Promise<{ slug: string }>;
};

// ✅ TYPE RESPONSE
type EventDetailResponse = {
  meetingPlacePageEventCollection: {
    items: {
      sys: { id: string };
      name: string;
      caption?: string;
      startDate?: string;
      endDate?: string;
      mediaField?: {
        altText?: string;
        jsonBynderAsset?: any;
      };
    }[];
  };
};

export default async function EventDetail({ params }: Props) {
  const { slug } = await params;

  const res = await client.query<EventDetailResponse>({
    query: gql`
      query GetEventBySlug($slug: String!, $locale: String!) {
        meetingPlacePageEventCollection(
          where: { slug: $slug }
          limit: 1
          locale: $locale
        ) {
          items {
            sys { id }
            name
            caption
            startDate
            endDate

            mediaField {
              ... on MediaWrapper {
                altText
                jsonBynderAsset
              }
            }
          }
        }
      }
    `,
    variables: { slug, locale: "en" },
    fetchPolicy: "no-cache",
  });

  const event =
    res.data?.meetingPlacePageEventCollection?.items?.[0];

  if (!event) {
    return <div className="p-6">Event not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <img
        src={getImageUrl(event.mediaField)}
        alt={event.name}
        className="w-full h-[400px] object-cover rounded"
      />

      <h1 className="text-3xl font-bold mt-6">
        {event.name}
      </h1>

      {event.caption && (
        <p className="text-gray-500 mt-2">
          {event.caption}
        </p>
      )}

      {event.startDate && (
        <p className="text-sm text-gray-400 mt-2">
          {new Date(event.startDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
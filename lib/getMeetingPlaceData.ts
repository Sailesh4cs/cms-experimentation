import { gql } from "@apollo/client";
import { client } from "./apolloClient";
import { EventItem } from "./types";

export const GET_EVENT_LIST = gql`
  query GetEventList($slug: String!, $locale: String!) {
    meetingPlacePageEventListCollection(
      where: { slug: $slug }
      limit: 1
      locale: $locale
    ) {
      items {
        eventItemsCollection(limit: 20) {
          items {
            sys { id }
            name
            slug
            caption
            startDate
            endDate
            isValid

            mediaField {
              ... on MediaWrapper {
                altText
                jsonBynderAsset
              }
            }

            ntExperiencesCollection(limit: 1) {
              items {
                ... on NtExperience {
                  sys { id }
                  ntName
                  ntType
                  ntAudience {
                    sys { id }
                  }
                  ntVariantsCollection(limit: 2) {
                    items {
                      ... on MeetingPlacePageEvent {
                        sys { id }
                        name
                        slug
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
                }
              }
            }
          }
        }
      }
    }
  }
`;

// ── TYPES ──────────────────────────────────────────────────────────────────

export type NinetailedExperience = {
  sys: { id: string };
  ntName?: string;
  ntType?: string;
  ntAudience?: { sys: { id: string } } | null;
  ntVariantsCollection?: {
    items: EventItem[];
  };
};

export type EventWithExperiment = EventItem & {
  ntExperiencesCollection?: {
    items: NinetailedExperience[];
  };
};

type GetEventListResponse = {
  meetingPlacePageEventListCollection: {
    items: {
      eventItemsCollection: {
        items: EventWithExperiment[];
      };
    }[];
  };
};

// ── FUNCTION ───────────────────────────────────────────────────────────────

export const getMeetingPlaceData = async (
  slug: string,
  locale: string
): Promise<EventWithExperiment[]> => {
  const res = await client.query<GetEventListResponse>({
    query: GET_EVENT_LIST,
    variables: { slug, locale },
    fetchPolicy: "no-cache",
  });

  const events =
    res.data?.meetingPlacePageEventListCollection?.items?.[0]
      ?.eventItemsCollection?.items || [];

  return events.filter((e) => e?.isValid !== "invalid");
};

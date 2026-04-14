import { gql } from '@apollo/client';
import { client } from './apolloClient';
import { EventItem } from './types';
import { EXPERIMENT_EVENT_IDS } from './variantConfig';

type GetExperimentResponse = {
  meetingPlacePageEventCollection: {
    items: EventItem[];
  };
};

export async function getExperimentEvents(): Promise<EventItem[]> {
  const res = await client.query<GetExperimentResponse>({
    query: gql`
      query GetExperimentEvents($ids: [String!]!) {
  meetingPlacePageEventCollection(
    where: { sys: { id_in: $ids } }
  ) {
    items {
      sys { id }
      name
      caption

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
    variables: {
      ids: EXPERIMENT_EVENT_IDS,
    },
    fetchPolicy: 'no-cache',
  });

  return res.data?.meetingPlacePageEventCollection?.items || [];
}
// import { gql } from '@apollo/client';
// import { client } from './apolloClient';

// export const GET_EVENT = gql`
//   query GetEvent($id: String!) {
//     meetingPlacePageEvent(id: $id) {
//       sys { id }
//       name
//       tags
//     }
//   }
// `;

// interface GetEventResponse {
//   meetingPlacePageEvent: {
//     sys: { id: string };
//     name: string;
//     tags: string[];
//   };
// }

// export const getEventById = async (id: string) => {
//   const res = await client.query<GetEventResponse>({
//     query: GET_EVENT,
//     variables: { id },
//   });

//   return res.data?.meetingPlacePageEvent;
// };
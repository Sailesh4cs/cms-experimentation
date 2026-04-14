import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const SPACE = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
const TOKEN = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;
const ENV = process.env.NEXT_PUBLIC_CONTENTFUL_ENV;

const link = new HttpLink({
  uri: `https://graphql.contentful.com/content/v1/spaces/${SPACE}/environments/${ENV}`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
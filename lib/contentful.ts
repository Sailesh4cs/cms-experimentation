import { createClient } from 'contentful';

export const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
  environment: process.env.CONTENTFUL_ENV,
});

console.log('SPACE:', process.env.CONTENTFUL_SPACE_ID);
console.log('TOKEN:', process.env.CONTENTFUL_ACCESS_TOKEN);
console.log('ENV:', process.env.CONTENTFUL_ENV);
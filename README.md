# AAY Lunch

A scraper for lunch places near my office. Refresh the database and fetch the latest with `/refresh`. 

Is a restaurant missing? Make a PR!

## Setup

For local dev:

```
npx wrangler d1 execute aay-lunch --file ./sql/create_db.sql -e=dev
```



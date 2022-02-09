# akamai-hook Cloudflare Worker

This code implements a [Cloudflare worker](https://developers.cloudflare.com/workers/) utilizing Cloudflare's [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update) that caches an Akamai header using an edge instance of Redis ([Upstash](https://www.upstash.com)).

### 1. See akamai-proxy README
Complete the steps outlined in the [akamai-proxy repo](https://github.com/okta-dfuhriman/akamai-proxy) before continuing. 

### 2. Generate New Worker
[Generate a new project](https://developers.cloudflare.com/workers/cli-wrangler/commands#generate) by directly cloning this repo.

`wrangler generate akamai-proxy https://github.com/okta-dfuhrimanak/akamai-hook`

### 3. Generate an API Key for Okta
Generate a [ULID](https://ulidgenerator.com/) or [GUID](https://www.guidgenerator.com/) to be provided to Okta as token hook's api 'key'. 

### 4. Update Cloudflare Config
1. Using the Wrangler CLI, set the bearer token from Upstash using `wrangler secret put UPSTASH_TOKEN`. You will then be prompted to enter the token.
2. Use the ULID/GUID from step 3 to set the `API_KEY` secret using `wrangler secret put API_KEY`. 
3. In the `wrangler.toml` file, add the following and set the values appropriately:
```toml
[vars]
# Get this value from your Upstash account.
UPSTASH_ENDPOINT = "https://{{your-upstash-endpoint}}"
```
_Note: Your `account_id` should have been set in the config during the project creation but, if not, double check it and set it._

### 5. Publish the Worker
Run the following to [push the worker to your Cloudflare account](https://developers.cloudflare.com/workers/cli-wrangler/commands#publishing-to-workersdev).

`wrangler publish`

### 6. Configure the Token Hook in Okta
Follow [Okta's instructions](https://developer.okta.com/docs/concepts/inline-hooks/#inline-hook-setup) for creating an inline token hook using the following configuration: 

| Field | Value |
| --- | --- |
| `Name` | `Akamai Token Hook` _(or whatever you want)_ |
| `URL` | _provide the URL for the Cloudflare worker_ |
| `Authentication field` | `Authorization` |
| `Authentication secret` | ULID/GUID from step 3. |

import { Router } from 'itty-router';
import { auth, hget } from '@upstash/redis';

auth(UPSTASH_ENDPOINT, UPSTASH_TOKEN);

const getHash = async (state) => {
    try {
        const { data, error } = await hget(state, 'data');

        return { data, error };
    } catch (e) {
        console.error(e);
        return e;
    }
};

const parseHeader = async (_data) => {
    let result = {};

    _data.split(';').forEach(item => {
        const parsedItem = item.split('=');

        const key = parsedItem[0];
        const value = parsedItem[1];

        if (value.includes('|')) {
            let nestedValue = {};

            values.split('|').forEach(item => {
                const _parsedItem = item.split(':');

                nestedValue[_parsedItem[0]] = _parsedItem[1];
            });
            result[key] = nestedValue;
        } else {
            result[key] = value;
        }
    });

    return result;
}

const verify = (req, res) => {
    try {
        const challenge = req.headers['x-okta-verification-challenge'];

        let resp = { verification: challenge };

        return new Response(JSON.stringify(resp));

    } catch (error) {
        throw error
    }
}


/*
Create a new router
*/
const router = Router();

/*
Handle an Okta verification request
*/
router.get('*', (req, res) => verify(req, res));

/*
Handle an Okta token hook request
*/
router.POST('*', async (req, res) => {
    const { authorization } = Object.fromEntries(req.headers) || {};

    if (!authorization || authorization !== API_KEY) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { context, identity } = req.body.data || {};
    const { user, protocol: { request } } = context || {};
    const { state } = request || {};

    const akamaiHeader = await parseHeader(await getHash(state)) || undefined;

    if (akamaiHeader) {
        const response = {
            commands: [
                {
                    type: 'com.okta.access.patch',
                    value: [
                        {
                            op: 'add',
                            path: '/claims/risk_profile',
                            value: akamaiHeader
                        }
                    ]
                }
            ]
        }

        return new Response(JSON.stringify(response));
    } else {
        return new Response(null, { status: 204 });
    }

});

/*
This snippet ties our worker to the router we defined above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/

addEventListener('fetch', (event) => {
    try {
        return event.respondWith(router.handle(event.request));
    } catch (error) {
        console.error(error);
        return event.respondWith(
            new Response('Error thrown ' + error.message || error)
        );
    }
});

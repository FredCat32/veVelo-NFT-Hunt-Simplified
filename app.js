import { request } from 'https';

const fetchNFTData = async () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'quixotic-opt-mainnet.herokuapp.com',
            port: 443,
            path: '/api/collection/0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26/tokens/?availability=forSale&currency=all&limit=600&offset=0&query=&sort=',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Token abf6b7be54f3ed9ba696723fb4155a67b88277b4',
            },
        };

        const req = request(options, (res) => {
            let body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                const data = JSON.parse(body);
                resolve(data);
            });
        });

        req.on('error', function (e) {
            console.log('Error : ' + e.message);
            reject(e);
        });

        req.end();
    });
};

const fetchCoinPrice = async () => {
    return new Promise((resolve, reject) => {
        const coin = `velodrome-finance`;
        const id = coin.slice(0, coin.length);
        const options = {
            hostname: 'api.coingecko.com',
            port: 443,
            path: `/api/v3/coins/${id}?tickers=true&market_data=true`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = request(options, (res) => {
            let body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                const data = JSON.parse(body);
                resolve(data.market_data.current_price.usd);
            });
        });

        req.on('error', function (e) {
            console.log('Error : ' + e.message);
            reject(e);
        });

        req.end();
    });
};

(async () => {
    const currentPrice = await fetchCoinPrice();
    const data = await fetchNFTData();

    const venfts = {};

    for (let i = 0; i < data.results.length; i++) {
        if (data.results[i].image) {
            const nft_metadata = data.results[i].image;
            const parsed_nft_metadata = nft_metadata.split(',');
            const coded_string = parsed_nft_metadata[1];

            if (coded_string) {
                let bdecoded = Buffer.from(coded_string, 'base64').toString(
                    'utf8',
                );
                const num = 1000000000000000000;
                const velo = bdecoded.split('value')[1];

                const veloInt = parseInt(velo);
                const veloLocked = veloInt / num;
                const sellOrder = data.results[i].sell_order.usd_price;

                const veloValue = veloLocked * currentPrice;
                const discountPercent = (1 - sellOrder / veloValue) * 100;

                if (discountPercent > 35 && veloValue > 1) {
                    venfts[data.results[i].token_id] = {
                        'Listing Price (USD)': +sellOrder.toFixed(2),
                        'Current Locked Value (USD)': +veloValue.toFixed(2),
                        'Percent Discount': +discountPercent.toFixed(2),
                    };
                }
            }
        }
    }

    console.log(`Found ${Object.keys(venfts).length} veNFTs:\n`);
    console.table(venfts);
    console.log(
        '\nCollection link: https://qx.app/asset/0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26/',
    );
    console.log(
        'Add the veNFT id (index column) to the end of the link to access one directly\n',
    );
})();

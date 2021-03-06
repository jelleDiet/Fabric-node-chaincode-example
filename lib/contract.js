/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');

class NodeContract extends Contract {

    async exists(ctx, key) {
        const buffer = await ctx.stub.getState(key);
        return (!!buffer && buffer.length > 0);
    }

    async set(ctx, key, value) {
        await ctx.stub.putState(key, value);
        return value;
    }

    async get(ctx, key) {
        const exists = await this.exists(ctx, key);
        if (!exists) {
            throw new Error(`The key ${key} does not exist`);
        }
        let result = await ctx.stub.getState(key);
        return JSON.parse(result.toString());
    }

    async getHistory(ctx, key) {
        let allResults = [];
        let resultsIterator = await ctx.stub.getHistoryForKey(key);

        while (true) {
            let jsonRes = {};
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {

                jsonRes.txId = res.value.tx_id;
                jsonRes.timestamp = res.value.timestamp;
                jsonRes.isDelete = res.value.is_delete.toString();
                try {
                    jsonRes.value = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.value = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }

            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                return allResults;
            }

        }

    }

    async delete(ctx, key) {
        const exists = await this.exists(ctx, key);
        if (!exists) {
            throw new Error(`The key ${key} does not exist`);
        }
        await ctx.stub.deleteState(key);
        return "Object with id:" + key + " successfully deleted";
    }

    async query(ctx, query) {
        let allResults = [];
        let resultsIterator = await ctx.stub.getQueryResult(query);

        while (true) {
            let jsonRes = {};
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    jsonRes = (JSON.parse(res.value.value.toString('utf8')));
                } catch (err) {
                    console.log(err);
                    jsonRes = (res.value.value.toString('utf8'));
                }
                allResults.push(jsonRes);
            }

            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                return allResults;
            }

        }

    }

    async queryWithPagination(ctx, args) {

        if (args.length < 3) {
            return shim.Error("Incorrect number of arguments. Expecting 3");
        }

        const queryString = args[0];
        const pageSize = 5;
        const bookmark = args[2];

        let allResults = [];
        const {resultsIterator, metadata} = await ctx.stub.getQueryResultWithPagination(queryString, pageSize, bookmark);

        while (true) {
            let jsonRes = {};
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    jsonRes = (JSON.parse(res.value.value.toString('utf8')));
                } catch (err) {
                    console.log(err);
                    jsonRes = (res.value.value.toString('utf8'));
                }
                allResults.push(jsonRes);
            }

            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                allResults.ResponseMetadata = {
                    RecordsCount: metadata.fetched_records_count,
                    Bookmark: metadata.bookmark
                };
                return allResults;
            }

        }

    }

}
;




module.exports = NodeContract;

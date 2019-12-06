/*
 * Copyright (c) 2019 HERE Europe B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * License-Filename: LICENSE
 */

// Serverless Function for HERE Map Tile API

'use strict';

const config = require("../hereLibs/configurations");
const serverlessHandler = require("../hereLibs/serverlessHandler")();
const asyncMiddleware = require("../hereLibs/asyncMiddleware");
const reqProcessor = require("../hereLibs/reqProcessor");
const loggers = require("../hereLibs/logger");
const app = require("express")();
const compression = require("compression");

// HERE credentials API Key
const HERE_API_KEY = process.env.HERE_API_KEY;

// Binds the express app to an Azure Function handler
app.use(compression());
module.exports = serverlessHandler(app);

// API URL
const HERE_MAPTILE_AERIAL_URL = config.authUrls.HERE_MAPTILE_AERIAL_URL;
const HERE_MAPTILE_BASE_URL = config.authUrls.HERE_MAPTILE_BASE_URL;
const HERE_MAPTILE_PANO_URL = config.authUrls.HERE_MAPTILE_PANO_URL;
const HERE_MAPTILE_TRAFFIC_URL = config.authUrls.HERE_MAPTILE_TRAFFIC_URL;

app.all("/api/map_tile/*", asyncMiddleware(async(req, res) => {

    // Classify Base URL along with randmozied server {1-4} and build here api URL.
    let HERE_API_URL = buildHereApiUrl(req);

    // get logger instance, ( it varies based on selection of express handler.)
    let logger = loggers.getLogger(req);

    // Process Request Object and Prepare Proxy URL using HERE APP Credentials. 
    let proxyUrl = reqProcessor.processRequest(logger, req, HERE_API_KEY, HERE_API_URL);
    // Invoke Proxy URL and fetch Response, GET/POST call is decided based on incoming method.
    let result = await reqProcessor.getAPIResult(logger, req, proxyUrl);

    // Set the Response Object Headers ,StatusCode  and Response Body.
    reqProcessor.sendResponse(logger, req, res, result);

}));

function classifyURL(req) {
    if (req.url.indexOf("api/map_tile/aerial/") > 0) {
        return "aerial"
    } else if (req.url.indexOf("api/map_tile/base/") > 0) {
        return "base"
    } else if (req.url.indexOf("api/map_tile/pano/") > 0) {
        return "pano"
    } else if (req.url.indexOf("api/map_tile/traffic/") > 0) {
        return "traffic"
    }
    return "" //Default to ""(empty str) .
}

function buildHereApiUrl(req) {

    let randomServer = reqProcessor.chooseRandomServer();
    let resultUrl = '';
    switch (classifyURL(req)) {
        case "aerial":
            resultUrl = HERE_MAPTILE_AERIAL_URL.replace("1TO4", randomServer.toString());
            break;
        case "base":
            resultUrl = HERE_MAPTILE_BASE_URL.replace("1TO4", randomServer.toString());
            break;
        case "pano":
            resultUrl = HERE_MAPTILE_PANO_URL.replace("1TO4", randomServer.toString());
            break;
        case "traffic":
            resultUrl = HERE_MAPTILE_TRAFFIC_URL.replace("1TO4", randomServer.toString());
            break;
        default:
            resultUrl = "";
            break;
    }
    return resultUrl;
}


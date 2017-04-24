'use strict';
import Joi from 'joi';
import Boom from 'boom';

import { getRouter } from '../services/rra-osm-p2p';

const rraOsmRoute = {
  path: '/projects/{projId}/scenarios/{scId}/osm/{path*}',
  method: '*',
  config: {
    validate: {
      params: {
        projId: Joi.number(),
        scId: Joi.number(),
        path: Joi.string()
      }
    },
    // Ensure that the payload is still a stream so the osm-p2p-server
    // can handle.
    payload: {
      output: 'stream',
      maxBytes: 1000 * 1024 * 1024
    }
  },
  handler: (request, reply) => {
    const { projId, scId, path } = request.params;
    const router = getRouter(projId, scId);

    let req = request.raw.req;
    let res = request.raw.res;

    let qs = req.url.match(/\?(.*)+/);
    qs = qs ? qs[0] : '';

    if (router.match(request.method, `/api/0.6/${path}`)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }

    req.url = `/api/0.6/${path}${qs}`;

    if (!router.handle(req, res)) {
      return reply(Boom.notFound());
    }
  }
};

exports.register = function (server, options, next) {
  server.route(rraOsmRoute);
  next();
};

exports.register.attributes = {
  'name': 'rra-osm-p2p-server',
  'version': '0.1.0',
  'description': 'RRA connection to osm-p2p-server'
};
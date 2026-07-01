const { buildJWKS } = require('../../utils/keys');

const getJWKSController = (req, res) => res.json(buildJWKS());

module.exports = { getJWKSController };
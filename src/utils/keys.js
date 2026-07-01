const fs = require('fs');
const crypto = require('crypto');
const config = require('../configs/config');

let privateKey;
let publicKey;
let jwks;

const loadPrivateKey = () => {
    if (!privateKey) {
        privateKey = fs.readFileSync(config.app.JWT_PRIVATE_KEY_PATH, 'utf8');
    }
    return privateKey;
};

const loadPublicKey = () => {
    if (!publicKey) {
        publicKey = fs.readFileSync(config.app.JWT_PUBLIC_KEY_PATH, 'utf8');
    }
    return publicKey;
};

const buildJWKS = () => {
    if (!jwks) {
        const jwk = crypto.createPublicKey(loadPublicKey()).export({ format: 'jwk' });
        jwks = {
            keys: [{ 
                kty: jwk.kty, 
                use: 'sig', 
                alg: 'RS256', 
                kid: config.app.JWT_KEY_ID, 
                n: jwk.n, 
                e: jwk.e 
            }],
        };
    }
    return jwks;
};

module.exports = { loadPrivateKey, loadPublicKey, buildJWKS };
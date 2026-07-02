/**
 * @fileoverview This module provides utility functions for loading and managing cryptographic keys.
 * It includes functions to load the private and public keys from the file system, as well as to build a JSON Web Key Set (JWKS) from the public key.
 */
const fs = require('fs');
const crypto = require('crypto');
const config = require('../configs/config');

let privateKey;
let publicKey;
let jwks;

/**
 * Load the private key from the file system.
 * @returns {string} The private key as a string.
 */
const loadPrivateKey = () => {
    if (!privateKey) {
        privateKey = fs.readFileSync(config.app.JWT_PRIVATE_KEY_PATH, 'utf8');
    }
    return privateKey;
};

/**
 * Load the public key from the file system.
 * @returns {string} The public key as a string.
 */
const loadPublicKey = () => {
    if (!publicKey) {
        publicKey = fs.readFileSync(config.app.JWT_PUBLIC_KEY_PATH, 'utf8');
    }
    return publicKey;
};

/**
 * Build the JSON Web Key Set (JWKS) from the public key.
 * @returns {object} The JWKS object.
 */
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
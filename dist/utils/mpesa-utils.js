"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMpesaToken = exports.generateMpesaPassword = void 0;
const axios_1 = __importDefault(require("axios"));
const generateMpesaPassword = (shortcode, passkey, timestamp) => {
    const buffer = Buffer.from(`${shortcode}${passkey}${timestamp}`);
    return buffer.toString("base64");
};
exports.generateMpesaPassword = generateMpesaPassword;
const getMpesaToken = async () => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    const response = await axios_1.default.get(process.env.MPESA_AUTH_URL, {
        headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
};
exports.getMpesaToken = getMpesaToken;

import jwt from 'jsonwebtoken';
import axios from 'axios';

export const generateMpesaPassword = (shortcode: string, passkey: string, timestamp: string ) =>{
    const buffer =  Buffer.from(`${shortcode}${passkey}${timestamp}`);
    return buffer.toString("base64");
};

export const getMpesaToken = async () => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    
    const response = await axios.get(process.env.MPESA_AUTH_URL!, {
      headers: { Authorization: `Basic ${auth}` }
    });
  
    return response.data.access_token;
  };
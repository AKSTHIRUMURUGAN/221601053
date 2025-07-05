import axios from "axios";

const AUTH_URL = "http://20.244.56.144/evaluation-service/auth";
const LOG_URL = "http://20.244.56.144/evaluation-service/logs";
import { credentials } from "./env.js";


async function getAuthToken() {
  try {
    const response = await axios.post(AUTH_URL, credentials, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    return response.data.access_token;
  } catch (err) {
    console.error("Auth failed:", err.response?.data || err.message);
    throw err;
  }
}

 export default async function Log(stack, level, pkg, message) {
  try {
    const token = await getAuthToken();
    const res = await axios.post(
      LOG_URL,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("Log sent:", res.data.message);
  } catch (err) {
    console.error("Failed to send log:", err.response?.data || err.message);
  }
}


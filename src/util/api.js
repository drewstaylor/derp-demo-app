import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL;
const apiClient = axios.create();

/**
 * HTTP Get
 * @param {String} endpoint : The endpoint URI to be called; e.g. '/test'
 * @param {Object} params: Optional get params (query string)
 */
async function get(endpoint, params) {
  let apiEndpoint = API_URL + endpoint, res;
  if (params) {
      res = await apiClient.get(apiEndpoint, {params: params});
  } else {
      res = await apiClient.get(apiEndpoint);
  }
  return res;
}

/**
 * HTTP Post
 * @param {String} endpoint : The endpoint URI to be called; e.g. '/test'
 * @param {Object} data : The post payload to be sent; e.g. {arg1: value, arg2: value}
 */
async function post(endpoint, data) {
  if (typeof data !== 'object') {
    throw new Error('Payload rejected. Object required, got ' + typeof data);
  }
  let apiEndpoint = API_URL + endpoint;
  let res = await apiClient.post(apiEndpoint, data);
  return res;
}

const request = {
  get: get,
  post: post,
};

export { request };
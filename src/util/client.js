import { 
  leapClient, 
  keplrClient, 
  cosmostationClient, 
  metamaskClient
} from './cosmwasm';
  
/**
 * Gets signing client instance
 * @param {String} wallet : Supported wallet values are; 'keplr', 'leap', 'cosmostation', 'offline'
 * @returns {SigningCosmWasmClient}
 */
  async function Client(wallet = 'keplr') {
  let client;
  switch (wallet) {
    case 'cosmostation': {
      client = await cosmostationClient();
      break;
    }
    case 'keplr': {
      client = await keplrClient();
      break;
    }
    case 'leap': {
      client = await leapClient();
      break;
    }
    case 'metamask': {
      client = await metamaskClient();
      break;
    }
  }
  return client;
}

async function Accounts(client = null) {
  if (!client) client = await Client();
  let accounts = (client['offlineSigner']) ? await client.offlineSigner.getAccounts() : [];
  return accounts;
}

export { Client, Accounts };
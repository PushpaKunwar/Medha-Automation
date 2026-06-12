const BASE_DOMAIN = 'https://live.mafatlaleducation.com';

const URLS = {
  login:      `${BASE_DOMAIN}:5020/`,
  dashboard:  `${BASE_DOMAIN}:5110/`,
  shellApp:   `${BASE_DOMAIN}:5020/`,   // SPA shell stays on :5020 after login
  remoteApp:  `${BASE_DOMAIN}:5080/`,   // Microfrontend chunks served from :5080
  worksheet:     `${BASE_DOMAIN}:5110/assignment`,   // Lesson → Worksheet
  collaboration: `${BASE_DOMAIN}:5110/collaboration`, // Lesson → Collaboration
};

const API = {
  login: 'https://api.mafatlaleducation.com/webapigateway/api/account/login',
};

module.exports = { URLS, API, BASE_DOMAIN };

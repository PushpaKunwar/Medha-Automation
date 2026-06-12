const credentials = {
  validUser: {
    email:    process.env.TEST_EMAIL    || 'teacherdemo@gmail.com',
    password: process.env.TEST_PASSWORD || 'Teacher@01',
  }
};

module.exports = { credentials };

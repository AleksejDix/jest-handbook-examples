/* eslint-disable unicorn/prevent-abbreviations */
const apiKeyToUser = {
  '76b1e728-1c14-43f9-aa06-6de5cbc064c2': 'hugo'
};

const apiKeys = new Set(Object.keys(apiKeyToUser));
const isApiKey = (key) => apiKeys.has(key);

function headerAuth(req, res, next) {
  if (req.session.data) {
    return next();
  }

  const authenticationHeader = req.get('authorization');
  if (!authenticationHeader) {
    return next();
  }

  const apiKey = authenticationHeader.replace('Bearer', '').trim();
  if (!isApiKey(apiKey)) {
    return next();
  }

  req.session.data = {username: apiKeyToUser[apiKey]};
  next();
}

const mockRequest = (authHeader, sessionData) => ({
  get(name) {
    if (name === 'authorization') return authHeader;
    return null;
  },
  session: {data: sessionData}
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

test('should set req.session.data if API key is in authorization and is valid', async () => {
  const req = mockRequest('76b1e728-1c14-43f9-aa06-6de5cbc064c2');
  const res = mockResponse();
  await headerAuth(req, res, () => {});
  expect(req.session.data).toEqual({username: 'hugo'});
});
test('should not do anything if req.session.data is already set', async () => {
  const req = mockRequest('76b1e728-1c14-43f9-aa06-6de5cbc064c2', {
    username: 'guest'
  });
  const res = mockResponse();
  await headerAuth(req, res, () => {});
  expect(req.session.data).toEqual({username: 'guest'});
});
test('should not do anything if authorization header is not present', async () => {
  const req = mockRequest(undefined);
  const res = mockResponse();
  await headerAuth(req, res, () => {});
  expect(req.session.data).toBeUndefined();
});
test('should not do anything if api key is invalid', async () => {
  const req = mockRequest('invalid-api-key');
  const res = mockResponse();
  await headerAuth(req, res, () => {});
  expect(req.session.data).toBeUndefined();
});

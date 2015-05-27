angular.module('cnnxtMobile')
  .run(function ($state, Restangular, PASS_KEY, md5, $base64) {
    var encodeURL = function (element, operation, what, url, headers, params) {

      var query = {
        dothis: '',
        andthis: '&passcode=' + PASS_KEY
      }

      var result = {};

      query.dothis = _.map(params, function (value, key) {
        return key + '=' + value;
      }).join('&');

      query.andthis = md5.createHash(query.dothis + query.andthis);
      query.dothis = $base64.encode(query.dothis);
      result.params = query;

      return result;
    };

    Restangular.addFullRequestInterceptor(encodeURL);
  });
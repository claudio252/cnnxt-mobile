angular.module('cnnxtMobile')
  .run(function (Restangular, PASS_KEY, md5, $base64) {
    var encodeURL = function (element, operation, what, url, headers, params) {

      var query = {
        dothis: '',
        andthis: '&passcode=' + PASS_KEY
      }

      var result = {};

      if (_.isEmpty(params)) {
        return result;
      }

      query.dothis = _.map(params, function (value, key) {
        return key + '=' + value;
      }).join('&');

      query.andthis = md5.createHash(query.dothis + query.andthis);
      query.dothis = $base64.encode(query.dothis);
      result.params = query;

      return result;
    };

    var transformResponse = function (data, operation, what, url, response, deferred) {
      var extractedData;
      // .. to look for getList operations
      if (operation === "getList") {
        // .. and handle the data and meta data
        // Get the size
        var size = Object.keys(data).length;
        // Set only the relevant data.
        extractedData = _.toArray(data).slice(0, size - 1);
        // Set the API code returned.
        extractedData.error = data.error;
        // Set the size
        extractedData.paging = size;
      } else {
        extractedData = data.data;
      }
      return extractedData;
    };

    Restangular.addFullRequestInterceptor(encodeURL);
    Restangular.addResponseInterceptor(transformResponse);
});

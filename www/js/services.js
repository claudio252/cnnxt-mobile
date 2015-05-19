angular.module('cnnxtMobile.services', [])

.factory('Departments', function() {

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Health and Home',
    categories: [{
      name: 'departments',
      subcategories: [{
        name: 'cardiology'
      }, {
        name: 'pediatrics'
      }, {
        name: 'surgery'
      }, {
        name: 'administration'
      }, {
        name: 'cancer center'
      }, {
        name: 'cardiovascular'
      }, {
        name: 'emergency'
      }]
    }, {
      name: 'physicians'
    }, {
      name: 'dummy1'
    }, {
      name: 'dummy2'
    }]
  }, {
    id: 1,
    name: 'People, Patients, Caregivers'
  }, {
    id: 2,
    name: 'Clinical Spaces'
  }, {
    id: 3,
    name: 'Healthcare IT'
  }, {
    id: 4,
    name: 'Parking'
  }, {
    id: 5,
    name: 'Dining'
  }];

  return {
    all: function() {
      return chats;
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
})

// .factory('Departaments', function (Restangular) {

//   return {
//     get: function (world) {

//       var queryObj = {
//         action: 'get_hotspots_smh',
//         device: 'iphone',
//         type: 'department',
//         hospital_id: 6,
//         user_id: 1
//       };

//       return Restangular.oneUrl('test');
//     },
//     getById: function (href) {
//       return Restangular.oneUrl('avatarprofiles', href)
//     }
//   };
// });

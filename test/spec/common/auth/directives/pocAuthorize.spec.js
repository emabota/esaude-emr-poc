'use strict';

describe('pocAuthorize', function () {

  var $compile, $rootScope, $q, authorizationService;

  beforeEach(module('authentication'));

  beforeEach(inject(function (_$compile_, _authorizationService_, _$rootScope_, _$q_) {
    $compile = _$compile_;
    authorizationService = _authorizationService_;
    $rootScope = _$rootScope_;
    $q = _$q_;
  }));

  describe('user authorized', function () {

    beforeEach(function () {
      spyOn(authorizationService, 'hasPrivilege').and.callFake(function () {
        return $q(function (resolve) {
          resolve(true);
        })
      });
    });

    it('shows the contents', function () {

      var element = $compile('<poc-authorize privilege="\'Create Vitals\'"><div>Create Vitals Only!</div></poc-authorize>')($rootScope);

      $rootScope.$digest();
      expect(element.html()).toContain('Create Vitals Only!');
    });

  });

  describe('user not authorized', function () {

    beforeEach(function () {
      spyOn(authorizationService, 'hasPrivilege').and.callFake(function () {
        return $q(function (resolve) {
          resolve(false);
        })
      });
    });

    it('does not show the contents', function () {

      var element = $compile('<poc-authorize privilege="\'Create Vitals\'"><div>Create Vitals Only!</div></poc-authorize>')($rootScope);

      $rootScope.$digest();
      expect(element.html()).not.toContain('Create Vitals Only!');
    });

  });

});

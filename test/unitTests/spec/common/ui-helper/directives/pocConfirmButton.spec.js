describe('pocConfirmButton', () => {

  var element, onConfirm, onCancel, $compile, $rootScope;

  beforeEach(module('bahmni.common.uiHelper', 'templates'));

  beforeEach(inject((_$compile_, _$rootScope_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(() => {
    onConfirm = jasmine.createSpy();
    onCancel = jasmine.createSpy();

    $rootScope.onConfirm = onConfirm;
    $rootScope.onCancel  = onCancel;

    var html = '<poc-confirm-button on-confirm="onConfirm()" on-cancel="onCancel()" class="btn-danger">Delete</poc-confirm-button>';
    element = $compile(html)($rootScope);

    $rootScope.$digest();
  });


  it('should show a button with given class and transcluded content', () => {

    var button = element.find('button#button');

    expect(button.hasClass('btn-danger')).toBe(true);
    expect(button.hasClass('ng-hide')).toBe(false);
    expect(button.html()).toContain('Delete');

  });

  describe('clicked', () => {

    var button, confirmation;

    beforeEach(() => {
      button = element.find('button#button');
      confirmation = element.find('.confirmation');
    });

    it('should show confirm and cancel buttons', () => {

      expect(confirmation.hasClass('ng-hide')).toBe(true);

      button.click();

      expect(confirmation.hasClass('ng-hide')).toBe(false);

    });

    describe('confirmed', () => {

      var confirmBtn;

      beforeEach(() => {
        confirmBtn = confirmation.find('.btn-danger');
        button.click();
      });

      it('should call on-confirm binding', () => {

        confirmBtn.click();

        expect(onConfirm).toHaveBeenCalled();

      });

    });


    describe('canceled', () => {

      var cancelBtn;

      beforeEach(() => {
        cancelBtn = confirmation.find('.btn-warning');
        button.click();
      });

      it('should call on-cancel binding', () => {

        cancelBtn.click();

        expect(onCancel).toHaveBeenCalled();

      });

      it('should hide confirm and cancel buttons', () => {

        expect(confirmation.hasClass('ng-hide')).toBe(false);

        cancelBtn.click();

        expect(confirmation.hasClass('ng-hide')).toBe(true);

      });

      it('should hide confirm and cancel buttons', () => {

        expect(confirmation.hasClass('ng-hide')).toBe(false);

        cancelBtn.click();

        expect(confirmation.hasClass('ng-hide')).toBe(true);

      });

    });
  });

});

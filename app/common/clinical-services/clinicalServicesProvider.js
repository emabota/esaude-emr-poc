(function () {
  'use strict';

  angular.module('poc.common.clinicalservices')
    .provider('clinicalServicesService', clinicalServicesProvider);

  clinicalServicesProvider.$inject = ['$stateProvider'];

  function clinicalServicesProvider($stateProvider) {

    this.$get = ClinicalServiceForms;

    ClinicalServiceForms.$inject = ['$http', '$log', '$q', '$state', 'clinicalServicesFormMapper', 'encounterService',
      'visitService', 'patientService'];

    // TODO: force this service to be initialized before calling other methods.
    /* @ngInject */
    function ClinicalServiceForms($http, $log, $q, $state, clinicalServicesFormMapper, encounterService, visitService, patientService) {

      var dateUtil = Bahmni.Common.Util.DateUtil;

      var _currentModule = '';
      var _currentPatient = {};
      var _clinicalServices = [];

      var service = {
        init: init,
        getFormData: getFormData,
        getFormLayouts: getFormLayouts,
        getClinicalServiceWithEncountersForPatient: getClinicalServicesWithEncountersForPatient,
        getCurrentPatient: getCurrentPatient,
        loadClinicalServices: loadClinicalServices,
        deleteService: deleteService
      };

      return service;

      ///////////////

      /**
       * Loads clinical services and related form layout then registers the required routes for each form and form parts.
       *
       * NOTE: Don't forget to handle returned promise failure if not using in route resolve.
       *
       * SEE: clinicalServices.json and formLayout.json
       *
       * @param {String} moduleName Name of the module for which clinical services should be loaded.
       * @param {String} patientUuid The uuid of the patient for whom the forms will be filled
       */
      function init(moduleName, patientUuid) {

        if (moduleName === '') {
          return $q.reject('No current module set.');
        }

        _currentModule = moduleName;

        // TODO: dont load patient, use loaded from router resolve.
        var getPatient = patientService.getPatient(patientUuid);

        return $q.all([service.loadClinicalServices(), loadFormLayouts(), getPatient])
          .then(result => {
            _clinicalServices = result[0];
            var formLayouts = result[1];
            _currentPatient = result[2];

            _clinicalServices = _.filter(_clinicalServices, cs => {
              if (cs.constraints.minAge &&
                _currentPatient.age.years < cs.constraints.minAge) {
                return false;
              }
              return !(cs.constraints.maxAge &&
                _currentPatient.age.years > cs.constraints.maxAge);

            });

            _clinicalServices.forEach(cs => {

              cs.formLayout = formLayouts.filter(f => cs.id === f.id)[0];
            });
            registerRoutes($state, _clinicalServices, _currentPatient);
            return service;
          });
      }

      function deleteService(service, encounter) {
        var data = {
          params: {
            clinicalservice: service,
            encounter: encounter
          },
          withCredentials: true
        };
        return $http.get('/openmrs/ws/rest/v1/clinicalservice', data).then(response => response.data).catch(error => {
          $log.error('XHR Failed for deleteService: ' + error.data.error.message);
          return $q.reject(error);
        });
      }

      function getServiceFormEncounterType(clinicalService) {

        var representation = 'custom:(encounterType:(uuid))';

        var cs = findClinicalService(clinicalService);

        if (!cs) {
          return $q.reject();
        }

        return getForm(cs.formId, representation).then(form => form.encounterType);
      }

      function findClinicalService(clinicalService) {
        var found = _clinicalServices.filter(cs => cs.id === clinicalService.id)[0];

        if (!found) {
          $log.error('Clinical found ' + found + ' not found for module ' + _currentModule + '.');
        }

        return found;
      }

      /**
       * Loads form data with fields, concept answers and encounters for related clinical service.
       *
       * @param patient
       * @param clinicalService
       * @param [encounter] Encounter information to use for filling form data, if not defined last encounter for
       *                    clinicalService param will be used.
       *
       * @returns {Promise}
       */
      function getFormData(patient, clinicalService, encounter) {

        var cs = findClinicalService(clinicalService);

        if (!cs) {
          return $q.reject();
        }

        var representation = "custom:(description,display,encounterType,uuid,formFields:(uuid,required," +
          "field:(uuid,selectMultiple,fieldType:(display),concept:(answers,set,setMembers,uuid,datatype:(display)))))";

        return getClinicalServicesWithEncountersForPatient(patient, cs).then(service => getForm(service.formId, representation).then(form => {
          if (service.hasEntryToday && !encounter) {
            encounter = service.lastEncounterForService;
          }
          service.form = form;
          var formPayload = clinicalServicesFormMapper.map(service, encounter);
          formPayload.service = service;
          return formPayload;
        }));
      }

      /**
       * @param {Object} clinicalService
       * @returns {Object}
       */
      function getFormLayouts(clinicalService) {
        var service = findClinicalService(clinicalService);
        if (service) {
          return service.formLayout;
        }
      }

      /**
       * Loads clinicalServices for current module.
       *
       * NOTE: As this method will be decorated for authorization, inside clinicalServicesService always refer to it using
       * service.loadClinicalServices.
       *
       * @returns {Promise}
       */
      function loadClinicalServices() {
        return $http.get("/poc_config/openmrs/apps/" + _currentModule + "/clinicalServices.json")
          .then(response => response.data)
          .catch(error => {
            $log.error('XHR Failed for loadClinicalServices: ' + error.data);
            return $q.reject(error);
          });
      }

      function loadFormLayouts() {
        return $http.get('/poc_config/openmrs/apps/common/formLayout.json')
          .then(response => response.data)
          .catch(error => {
            $log.error('XHR Failed for loadFormLayouts. ' + error.data);
            return $q.reject(error);
          });
      }

      function getForm(uuid, representation) {
        var config = {
          withCredentials: true
        };

        if (representation) {
          config.params = {
            v: representation
          };
        }

        return $http.get("/openmrs/ws/rest/v1/form" + "/" + uuid, config).then(response => response.data);
      }

      /**
       * Returns clinical services with respective encounters.
       *
       * @param {Object} patient
       * @param {Object} [service] The clinical service, if not specified all services will be returned.
       * @returns {Promise}
       */
      function getClinicalServicesWithEncountersForPatient(patient, service) {

        if (service) {
          return getCsWithEncountersForPatient(patient, service);
        }

        var getAll = _clinicalServices.map(cs => getCsWithEncountersForPatient(patient, cs));

        return $q.all(getAll)
          .catch(error => {
            $log.error('XHR Failed for getClinicalServicesWithEncountersForPatient: ' + error.data.error.message);
            return $q.reject(error);
          });
      }

      function getCurrentPatient() {
        return _currentPatient;
      }

      function getCsWithEncountersForPatient(patient, service) {

        var service = angular.copy(service);

        var getTodaysVisit = visitService.getTodaysVisit(patient.uuid);

        return $q.all([getTodaysVisit, getServiceFormEncounterType(service)]).then(result => {

          var todayVisit = result[0];
          var encounterType = result[1];


          var representation = 'custom:(uuid,encounterDatetime,obs:(value,concept:(display,uuid,mappings:(' +
            'conceptReferenceTerm:(conceptSource:(display,uuid)))),groupMembers:(uuid,concept:(uuid,name),obsDatetime,value)),provider:(display))';
          return encounterService.getEncountersForPatientByEncounterType(patient.uuid, encounterType.uuid, representation)
            .then(encounters => {

            if (service.markedOn) {
              service.encountersForService = _.filter(encounters, e => {
                var foundObs = _.find(e.obs, o => o.concept.uuid === service.markedOn);
                if (!_.isUndefined(foundObs)) {
                  e.markedOnDate = foundObs.value;
                  return true;
                }
                return false;
              });
              service.lastEncounterForService = service.encountersForService[0];
              if (service.encountersForService[0]) service.lastEncounterForServiceDate =
                service.encountersForService[0].markedOnDate;
            } else {
              service.encountersForService = encounters;
              service.lastEncounterForService = encounters[0];
              if (encounters[0]) service.lastEncounterForServiceDate =
                encounters[0].encounterDatetime;
            }

            service.hasEntryToday = false;
            if (todayVisit && service.lastEncounterForService) {
              service.hasEntryToday = (dateUtil.diffInDaysRegardlessOfTime(todayVisit.startDatetime,
                service.lastEncounterForService.encounterDatetime) === 0);
            }
            service.hasServiceToday = false;
            var lastEncounterOfType = _.maxBy(encounters, 'encounterDatetime');
            if (todayVisit && lastEncounterOfType) {
              if (dateUtil.diffInDaysRegardlessOfTime(todayVisit.startDatetime,
                lastEncounterOfType.encounterDatetime) === 0) {
                service.hasServiceToday = true;
                service.lastServiceToday = lastEncounterOfType;
              }
            }


            service.list = false;

            return service;
          });
        });
      }
    }

    function registerRoutes($state, clinicalServices, patient) {
      clinicalServices.forEach(service => {

        var formLayout = service.formLayout;

        //create main state
        if (!$state.get(formLayout.sufix)) {
          var state = {
            url: service.url + "/:serviceId/:patientUuid",
            resolve: {
              initialization: 'initialization'
            },
            ncyBreadcrumb: {
              skip: true
            },
            params: {
              encounter: null, // used when editing or updating existing encounter for clinical service
              returnState: null
            }
          };

          state.component = 'formWizard';

          $stateProvider.state(formLayout.sufix, state);
        }
        //filter form parts by gender
        formLayout.parts = _.filter(formLayout.parts, part => {
          if (!part.constraints) {
            return true;
          } else if (part.constraints.gender === patient.gender) {
            return true;
          } else {
            return false;
          }
        });

        //create inner states
        formLayout.parts.forEach(part => {
          if (part.flexNextSref) {
            if (part.flexNextSref.gender) {
              part.nextSref = part.flexNextSref.gender[patient.gender];
            }
          }

          if (!$state.get(formLayout.sufix + part.sref)) {
            var innerState = {
              url: part.sref.replace('.', '/'),
              component: 'formWizardPart',
              resolve: {
                initialization: 'initialization'
              },
              ncyBreadcrumb: {
                skip: true
              }
            };
            $stateProvider.state(formLayout.sufix + part.sref, innerState);
          }
        });

        //confirm inner state
        if (!$state.get(formLayout.sufix + ".confirm")) {
          var confirmState = {
            url: '/confirm',
            component: 'formWizardConfirmPart',
            resolve: {
              initialization: 'initialization'
            },
            ncyBreadcrumb: {
              skip: true
            }
          };
          $stateProvider.state(formLayout.sufix + ".confirm", confirmState);
        }

        //create display state
        if (!$state.get(formLayout.sufix + "_display")) {
          var displayState = {
            url: service.url + "/:serviceId/:patientUuid/display",
            resolve: {
              initialization: 'initialization'
            },
            ncyBreadcrumb: {
              skip: true
            },
            params: {
              encounter: null,
              returnState: null
            }
          };

          displayState.component = 'formDisplay';

          $stateProvider.state(formLayout.sufix + "_display", displayState);
        }

      });
    }
  }

})();
